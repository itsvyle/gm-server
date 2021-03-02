let bd = "@replit/database";
const REPLDatabase = require(bd);

bd = "request";
const request = require(bd);

const Util = require("../gm-server/util.js");
Util.request = Util.request.bind(/*Util,*/request);

class ProxyReplDBServer extends REPLDatabase {
	constructor(key,authorizations) {
		super(key);
		if (!authorizations) {
			Object.defineProperty(this,'authorizations',{value: null});
		} else {
			if (!Array.isArray(authorizations)) authorizations = [authorizations];
			Object.defineProperty(this,'authorizations',{value: authorizations || null});
		}
	}

	route(router) {
		router.get((req,res) => {
			if (this.authorizations) {
				if (!req.headers.authorization || this.authorizations.includes(req.headers.authorization) !== true) {
					res.status(403);
					return res.send("Invalid authorization");
				}
			}
			let action = req.query.action;
			if (action) action = action.toLowerCase();
			
			
			if (!action || action == "get") {
				if (!req.query.key) {
					res.status(400);
					return res.send("Missing 'key' param");
				}
				this.get(req.query.key,{raw: true}).then((d) => {
					if (d === null) {
						res.status(404);
						return res.send("Could not find value");
					}
					res.status(200);
					res.send(d);
				}).catch((e) => {
					res.status(500);
					return res.send(e);
				});
			} else if (action == "empty") {
				this.empty().then(() => {
					res.status(201);
					res.end();
				}).catch((e) => {
					res.status(500);
					return res.send(e);
				});
			} else if (action == "list") {
				if (req.query.prefix) {
					this.list(req.query.prefix).then((keys) => {
						res.set("content-type","application/json");
						res.send(JSON.stringify(keys));
					}).catch((e) => {
						res.status(500);
						return res.send(e);
					});
				} else {
					this.list().then((keys) => {
						res.set("content-type","application/json");
						res.send(JSON.stringify(keys));
					}).catch((e) => {
						res.status(500);
						return res.send(e);
					});
				}
			}
		});
		
		router.post((req,res) => {
			if (this.authorizations) {
				if (!req.headers.authorization || this.authorizations.includes(req.headers.authorization) !== true) {
					res.status(403);
					return res.send("Invalid authorization");
				}
			}
			if (!req.body) {
				res.status(400);
				return res.send("Missing parameters");
			}
			if (typeof(req.body) !== "object") {
				res.status(400);
				return res.send("Invalid body format");
			}
			res.set('content-type',"application/json");
			if (!Object.keys(req.body).length) {
				return res.send({status: 1,requests: {}});
			}
			let s = 1;
			let r = {};
			let check = () => {
				if (Object.values(r).includes(false) === false) {
					res.send(JSON.stringify({
						status: 1,
						requests: r
					}));
				}
			};
			for(let k in req.body) {
				r[k] = false;
			}
			for(let k in req.body) {
				let v = req.body[k];
				this.set(k,v).then(() => {
					r[k] = true;
                    check();
				}).catch((e) => {
					s = 0;
					r[k] = e;
					check();
				});
			}
		});
		
		router.delete((req,res) => {
			if (this.authorizations) {
				if (!req.headers.authorization || this.authorizations.includes(req.headers.authorization) !== true) {
					res.status(403);
					return res.send("Invalid authorization");
				}
			}
			if (!req.query.key) {
				res.status(400);
				return res.send("Missing 'key' param");
			}
			this.delete(req.query.key).then(() => {
				res.status(201);
				res.end();
			}).catch((e) => {
				res.status(500);
				return res.send(e);
			});
		});
	}
}
//Last char: str.slice(0, -1);

class ProxyReplDBClient {
	constructor(url,authorization) {
		if (typeof(url) !== "string" || url == "" || !url) {
			throw new Error("'url' must be a non-empty string");
		}
		if (url.endsWith("/")) {
			url = url.slice(0,-1);
		}
		this.url = url;
		
		this.authorization = authorization || null;
	}
	
	resolveHeaders(h) {
		if (typeof(h) === "object") {
			if (this.authorization) h.authorization = this.authorization;
		} else {
			if (this.authorization) return {authorization: this.authorization};
			return {};
		}
	}
	
	get(k,opts) {
		if (!opts) opts = {raw: false};
		let u = this.url + "?" + Util.buildQuery({
			action: "get",
			key: k
		});
		return new Promise((resolve,reject) => {
			Util.request(u,{headers: this.resolveHeaders(),accept_codes: [200,404]}).then((r) => {
				if (r.http_code === 404) {
					return resolve(null);
				}	
				if (!r.res) {
					return resolve(null);
				}
				if (opts.raw === true) {
					return resolve(r.res);
				}
				return resolve(Util.JSONParse(r.res));
			}).catch(reject);
		});
	}
	
	list(prefix = null) {
		return new Promise((resolve,reject) => {
			Util.request(this.url + "?" + Util.buildQuery({
				action: "list",
				prefix: prefix
			}),{headers: this.resolveHeaders(),json: true}).then((r) => {
				return resolve(r.res);
			}).catch(reject);
		});
	}
	
	empty() {
		return new Promise((resolve,reject) => {
			Util.request(this.url + "?" + Util.buildQuery({
				action: "empty"
			}),{headers: this.resolveHeaders(),accept_codes: [200,201]}).then((r) => {
				return resolve(this);
			}).catch(reject);
		});
	}
	
	set(k,v) {
		let pay = {};
		pay[k] = v;
		return new Promise((resolve,reject) => {
			Util.request(this.url,{headers: this.resolveHeaders(),
				method: "POST",
				body: pay,
				json: true
			}).then((r) => {
				if (r.res.status !== 1) {
					return reject(r.res.requests[k]);
				} 
				return resolve(null);
			}).catch(reject);
		});
	}
	
	delete(k) {
		return new Promise((resolve,reject) => {
			Util.request(this.url + "?" + Util.buildQuery({
				action: "delete",
				key: k
			}),{headers: this.resolveHeaders(),method: "DELETE",accept_codes: [201]}).then((r) => {
				return resolve();
			}).catch(reject);
		});
	}
}

module.exports = {
    Server: ProxyReplDBServer,
    Client: ProxyReplDBClient
}
