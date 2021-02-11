const fs = require("fs");
if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function (search, replace) {
		return this.split(search).join(replace);
	};
}

const ErrorCodes = {
    "404": ["Not Found","This page could not be found"],
    "403": ["Forbidden","You cannot access this page"],
    "400": ["Bad Request","The request syntax was invalid"],
    "429": ["Too Many Requests","You sent too many requests to the server in a short amount of time"],
    "500": ["Internal Server Error","There was an unknown error in fulfilling the request"]
};

var errorPage = "";

const nl = `
`;
var escaping = {
	attribute: function (str) {
		return str.replaceAll('<', "&lt;").replaceAll('&', "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
	},
	content: function (str) {
		return str.replaceAll('<', "&lt;").replaceAll('&', "&amp;");
	}
};

function JSONToXML(json) {
	return _JSONToXML("xml", json).trim();
}

function _JSONToXML(key, value) {
	var r = `<${key} `;
	var inner = "";
	if (!typeof (value)) {
		return "";
	}
	if (Array.isArray(value)) {
		for (let item of value) {
			inner += _JSONToXML("item", item);
		}
	} else if (value == null) {} else if (typeof (value) == "object") {
		for (let k in value) {
			let v = value[k];
			if (v == null) {
				continue;
			}
			if (typeof (v) == "boolean") {
				v = (v === true) ? 1 : 0;
			}
			if (!typeof (v)) {
				continue;
			}
			if (typeof (v) == "string" || typeof (v) == "number") {
				r += `${k}="${escaping.attribute(String(v))}" `;
			} else if (Array.isArray(v)) {
				inner += nl + _JSONToXML(k, v);
			} else if (typeof (v) == "object") {
				inner += nl + _JSONToXML(k, v);
			}
		}
	} else {
		if (typeof (value) == "boolean") {
			value = (value === true) ? 1 : 0;
		}
		if (typeof (value) == "string" || typeof (value) == "number") {
			inner = escaping.content(value);
		}
	}
	return r.trim() + ">" + inner + `</${key}>` + nl;
}


function JSONParse(text,log) {
	try {
		return JSON.parse(text);
	} catch (err) {
		if (log) console.log(err);
		return null;
	}
}

module.exports = {
	toXML: JSONToXML,
	JSONParse: JSONParse,
	parseInt: function (s) {
		var r = parseInt(s);
		if (isNaN(r)) {
			return null;
		}
		return r;
	},
	debug: function (s) {
		console.log(s);
		return false;
	},
	classToJSON: function (obj_) {
		var cl = function (obj) {
			var res = {};
			var ks = Object.keys(obj)
				.filter(key => !key.endsWith("_"));
			let par = this;
			ks.forEach((k) => {
				let v = obj[k];
				if (v === undefined) v = null;
				if (v !== null && typeof (v) == "object") {
					v = cl(v);
				}
				res[k] = v;
			});
			return res;
		};
		return cl(obj_);
	},

	request: function (request, url, opts, clb) {
        let isPromise = false;
		if (typeof (clb) !== "function") {
            isPromise = true;
            clb = (r) => {
                return new Promise(function (resolve,reject) {
                    return (r.status === 1) ? resolve(r) : reject(r);
                });
            };
        }
		if (!request) return clb({
			status: 0,
			error: "Request must be an imported request npm instance"
		});
		if (!opts || typeof (opts) !== "object") opts = {};

		if (typeof (opts.headers) != "object") {
			opts.headers = {
				"content-type": "application/x-www-form-urlencoded"
			};
		}

		if (!Array.isArray(opts.accept_codes)) {
			opts.accept_codes = [200];
		}

		if (!opts.method) {
			opts.method = "GET";
		}

		let options = {};
        options.method = opts.method;
        if (opts.body !== null && typeof(opts.body) == "object") {
            opts.body = JSON.stringify(opts.body);
            if (!opts.headers['content-type']) {
                opts.headers['content-type'] = "application/json";
            }
        }

		if (!!opts.body) {
			options.body = opts.body;
		}

        if (!opts.headers['content-type']) {
            opts.headers['content-type'] = "application/x-www-form-urlencoded";
        }
        options.headers = opts.headers;

		if (!!opts.extra_attributes && typeof (opts.extra_attributes) == "object") {
			options = Object.assign(options, opts.extra_attributes);
		}
		request(url, options, function (error, response, body) {
			var r = {
				status: null,
				http_code: (!!response) ? response.statusCode : null,
				res: null,
				error_level: 0,
				error: null
			};

			if (error) {
				return clb({
					status: 0,
					error_level: 2,
					error: "Error making request: " + error
				});
			}
            r.headers = (!!response) ? response.headers : null;

			if (opts.accept_codes.includes(response.statusCode) === false) {
				r.status = 0;
				r.error_level = 1;
				r.error = "Error making request(" + String(r.http_code) + ": " + body + ")";
                if (opts.json === true) {r.res = JSONParse(body);} else {r.res = body;}
			} else {
				r.status = 1;
				if (opts.json === true) {
					r.res = JSONParse(body);
					if (r.res === null) {
						r.status = 0;
						r.res = null;
						r.error_level = 2;
						r.error = "Error reading json response";
					}
				} else {
					r.res = body;
				}
			}
			clb(r);
		});
        if (isPromise) {
            return new Promise(function (resolve,reject) {
                clb = function (r) {
                    return (r.status === 1) ? resolve(r) : reject(r);
                };
            });
        }
	},
	sortBy: function () {
		var fields = [].slice.call(arguments),
			n_fields = fields.length;

		return function (A, B) {
			var a, b, field, key, primer, reverse, result, i;

			for (i = 0; i < n_fields; i++) {
				result = 0;
				field = fields[i];

				key = typeof (field) === 'string' ? field : field.name;

				a = A[key];
				b = B[key];

				if (typeof (field.primer) !== 'undefined') {
					a = field.primer(a);
					b = field.primer(b);
				}

				reverse = (field.reverse) ? -1 : 1;

				if (a < b) {
					result = reverse * -1
				};
				if (a > b) {
					result = reverse * 1
				};
				if (result !== 0) {
					break;
				}
			}
			return result;
		};
	},
	escapeHTML: function (str) {
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	},
    formatNumber: function (n) {
		if (typeof (n) != "number") {
			return null;
		}
        return String(n).replace(/(.)(?=(\d{3})+$)/g,'$1,');
        return n.toLocaleString(
        undefined, // leave undefined to use the browser's locale,
                    // or use a string like 'en-US' to override it.
        { minimumFractionDigits: 0 }
        );
	},
	formatTime: function (milliseconds) {
		if (typeof (milliseconds) != "number") {
			return milliseconds;
		}
		if (milliseconds >= (3600 * 24 * 1000)) { //more than a day
			return `${Math.floor(milliseconds / (1000 * 60 * 60 * 24))}d ${Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h ${Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))}m ${Math.floor((milliseconds % (1000 * 60)) / 1000)}s`;
		} else if (milliseconds >= 3600 * 1000) {
			return `${Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h ${Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))}m ${Math.floor((milliseconds % (1000 * 60)) / 1000)}s`;
		} else if (milliseconds >= 60 * 1000) {
			return `${Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))}m ${Math.floor((milliseconds % (1000 * 60)) / 1000)}s`;
		} else {
			return String(milliseconds) + "s";
		}
	},
	deepEqual: function (object1, object2) {
		var isObject = function (object) {
			return (object != null && typeof object === 'object');
		};
		var keys1 = Object.keys(object1);
		var keys2 = Object.keys(object2);

		if (keys1.length !== keys2.length) {
			return false;
		}
		for (var i = 0; i < keys1.length; i++) {
			var key = keys1[i];
			var val1 = object1[key];
			var val2 = object2[key];
			var areObjects = isObject(val1) && isObject(val2);
			if (areObjects && !this.deepEqual(val1, val2) || !areObjects && val1 !== val2) {
				return false;
			}
		}
		return true;
	},
	UTCTime: function (d1) {
		if (!d1) {
			d1 = new Date();
		}
		var now = new Date(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes(), d1.getUTCSeconds(), d1.getUTCMilliseconds());
		return now.getTime();
	},
	generateID: function (length) {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	},
	express: function ({
		port,
		post,
		express
	}) {
        let bd = "express";
		if (!express) express = require(bd);
		if (!port) port = 3000;
		if (!post) post = false;

		var app = express();
		if (post === true) {
            let bd = "body-parser";
			var bodyParser = require(bd);
			app.use(bodyParser.json({
				limit: "50mb"
			}));
			app.use(bodyParser.urlencoded({
				limit: "50mb",
				extended: true
			}));
		}
		app.connect = function (clb) {
			if (clb === true) clb = () => {
				console.log("App listening at port: " + port);
			};
			if (typeof (clb) !== "function") {
				clb = () => {};
			}
			app.listen(port, () => {
				clb();
			});
		};
		return app;
	},
	parseCookies: function (rc) {
		var list = {}; //rc = request.headers.cookie;

		rc && rc.split(';').forEach(function (cookie) {
			var parts = cookie.split('=');
			list[parts.shift().trim()] = decodeURI(parts.join('='));
		});

		return list;
	},
	setupEval: function () {
	    const resetColor = "\x1b[0m";
	    const readline = require('readline');
	    const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	    });

	    var askReadCommand = function () {
		rl.question("Command:", (answer) => {
		    console.log("\x1b[34m",answer,resetColor);
		    if (answer === ".exit") {return process.exit(1);}
		    try {
			var m = eval(answer);
		    } catch (e) {
			console.error(e);
		    }
		    if (!m && m !== 0 && m !== false && m !== [] && (m === null && m === undefined)) {m = "Done";}
		    console.log("\x1b[34m",m,resetColor);
		    askReadCommand();
		});
	    }
	    askReadCommand();
	},
    PromiseError: function (error) {
        return new Promise(function (reso,rej) {
            return rej(error);
        });
    },
    buildQuery: function (args) {
		if (!args || typeof(args) != "object") {return "";}
		var ret = "";var v;
		for(var n in args) {
			v = args[n];
			if (v === null || v === undefined) {continue;}
			if (typeof(v) == "object" || Array.isArray(v)) {v = JSON.stringify(v);}
			if (typeof(v) == "number") {v = String(v);}
			if (typeof(v) == "boolean") {if (v === true) {v = "1";} else {v = "0";}}
			v = encodeURIComponent(v);
			if (ret != "") {ret += "&";}
			ret += n + "=" + v;
		}
		return ret;
	},
    errorPage: function (code,shortDesc,text,title) {
        if (!code) {return "Missing code argument in errorPage";}
        if (!shortDesc) {
            if (!(String(code) in ErrorCodes)) {return "Invalid 'shortDesc'";}
            let e = ErrorCodes[String(code)];
            if (Array.isArray(e)) {
                shortDesc = e[0];
                if (!text) {text = e[1];}
                if (e.length > 2) {
                    if (!title) {title = e[2];}
                }
            } else {
                shortDesc = e;
            }
        }
        if (!shortDesc) return null;
        if (!title) title = shortDesc;
        if (!text) text = "";
        if (title.startsWith("raw:") !== true) {
            title = String(code) + " - " + title;
        } else {
            title = title.slice("raw:".length);
        }

        if (!errorPage) {
            try {
                errorPage = fs.readFileSync(__dirname + "/errorPage.html");
                //console.log(errorPage.toString());
                errorPage = errorPage.toString();
            } catch (err) {
                return "Error getting error page";
            }
        }
        if (!errorPage) return "Error getting page";
        let d = errorPage;
        let repl = function (a,b) {d = d.split(a).join(b);};
        repl("{page-title}",title);
        repl("{error-code}",code);
        repl("{error-desc}",shortDesc);
        repl("{error-text}",text || "");
        return d;
    },
    routeWithError: function (req,res,data,showErrorPage) {
        if (Array.isArray(data)) {
            if (!data[0]) data[0] = 0;
            res.status(data[0]);
            if (!data[1]) data[1] = "Unknown Error";
            return res.send((showErrorPage === false) ? data[1] : _errorPage(data[0],null,data[1]));
        }
        return res.send(data);
    },
    simpleRouter: function (req,res,clb) {
        var url = req._parsedUrl;
        if (url.pathname.endsWith("/")) {url.pathname += 'index.html';}
        var filename = './public' + url.pathname;
        //res.set('Cache-Control','no-cache');
        let par = this;
        fs.readFile(filename, function(err, data) {
            if (err) {
                //res.sendStatus(404);
                if (typeof(clb) === "function") {
                    return clb(404,par.errorPage(404));
                }
                res.status(404);
                return res.send(par.errorPage(404));
            }
            if (filename.endsWith('.css')) {
                res.set('Content-Type', 'text/css; charset=UTF-8');
                res.set('x-content-type-options', 'text/css; charset=UTF-8');
            } else if (filename.endsWith('.html')) {
                res.set('Content-Type', 'text/html; charset=UTF-8');
                res.set('x-content-type-options', 'text/html; charset=UTF-8');
            } else if (filename.endsWith('.js')) {
                res.set('Content-Type', 'application/javascript');
                res.set('x-content-type-options', 'application/javascript');
            } else if (filename.endsWith('.png')) {
                res.set('Content-Type', 'image/png');
            } else if (filename.endsWith('.mp3')) {
                res.set('Content-Type', 'audio/mp3');
            }
            if (typeof(clb) === "function") {
                try {
                    data = data.toString();
                } catch (err) {
                    req.data = data;
                    return clb(500,par.errorPage(500,"Error Getting Data",""))
                }
                req.data = data;
                return clb(200,data);
            }
            res.status(200);
            res.send(data);
        });
    }
};
var _errorPage = module.exports.errorPage;
