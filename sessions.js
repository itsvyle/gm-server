

const {JSONParse,toXML} = require("./util.js");
const Collection = require("./collection.js");
const EventEmitter = require("events");

class Sessions extends EventEmitter {
    constructor(session_timeout) {
		super();
        this.sessions = new Collection();
        this.sessions.setNoDuplicateID(true);
        if (!session_timeout || typeof(session_timeout) !== "number") session_timeout = 90 * 1000;
        this.session_timeout = session_timeout;

        let par = this;
        Object.defineProperty(this, 'timer', {
            value: setInterval(function () {
                par.refresh();
            },session_timeout / 4),
            writable: true
        });
    }

    refresh() {
        let par = this;
        let n = Date.now();
        this.sessions.forEach((s) => {
            if (s.last_tick + par.session_timeout <= n) {
                if (s.type !== "ws") {
                    par.sessions.delete(s.id);
                } else {
                    try {s.ws.close(1000,"Tiemout");}catch(ere) {}
                    par.sessions.delete(s.id);
                }
                par.emit("session_timeout",s);
            }
        });
    }

    close(id,reason) {
        if (!id) return;
        let s = this.sessions.get(id);
        if (!s) return;
        if (s instanceof WSSession) {
            try {s.ws.close(4000,"Session manually closed (" + (reason || "NO REASON") + ")");} catch (err) {}
        }
        this.sessions.delete(id);
        this.emit("session_close",s);
    }

    createSession(thread,data) {
        if (!data || typeof(data) !== "object") data = {};
        delete data.thread;
        let id = this.sessions.createKey();
        
        let s = new Session(thread,id);
        s.data = data;
        this.sessions.set(id,s);
        this.emit("session_create",s);
        return s;
    }

    createWSSession(ws,thread,data) {
        if (!data || typeof(data) !== "object") data = {};
        delete data["thread"];
        var enc = "json";
        if (!!data.encoding) {
            enc = data.encoding;
            if (enc !== "xml") {
                enc = "json";
            }
            delete data['encoding'];
        }
        let id = this.sessions.createKey();
        let s = new WSSession(this,ws,thread,id);
        s.data = data;
        s.encoding = enc;
        s.init(this.session_timeout);
        this.sessions.set(id,s);
        this.emit("session_create",s);
        return s;
    }

    get(id) {
        if (!this.sessions.has(id)) return null;
        return this.sessions.get(id).get();
    }

    send(thread,type,d) {
        this.sessions.forEach((s) => {
            if (s.thread !== thread) return;
            s.send(type,d);
        });
    }

    sendToID(id,thread,type,d) {
        if (!this.sessions.has(id)) return;
        this.sessions.get(id).send(type,d,thread);
    }

    getRouter(ws_) {
        if (!ws_ || typeof(ws_) != "boolean") ws_ = false;
        let bd = "express";
        var express = require(bd);
        var router = express.Router();
        
        let par = this;
        router.get("/create",function (req,res) {
            if (!req.query.thread) {
                res.status(400);
                return res.send("Missing 'query' parameter");
            }
            let da = {};
            for(let n in req.query) {
                if (n === "thread") continue;
                da[n] = req.query[n];
            }
            let s = par.createSession(req.query.thread,da);
            res.set("content-type",'text/json');
            res.send(JSON.stringify({
                status: 1,
                session_id: s.id
            }));
        });

        router.get("/close",function (req,res) {
            if (!req.query.session_id) {
                res.status(400);
                return res.send("Missing 'session_id' argument");
            }
            let id = req.query.session_id;
            par.close(id);
            res.set("content-type",'text/json');
            res.send(JSON.stringify({
                status: 1,
                session_id: id
            }));
        });

        router.get("/refresh",function (req,res) {
            if (!req.query.session_id) {
                res.status(400);
                return res.send("Missing 'session_id' argument");
            }
            let id = req.query.session_id;
            let da = par.get(id);
            if (da === null) {
                res.status(404);
                return res.send("Session with id '" + id + "' does not exist");
            }
            res.set("content-type",'text/json');
            res.send(JSON.stringify({
                status: 1,
                res: da
            }));
        });

        router.get("/ping",function (req,res) {
            if (!req.query.session_id) {
                res.status(400);
                return res.send("Missing 'session_id' argument");
            }
            let id = req.query.session_id;
            if (!par.sessions.has(id)) {
                res.status(404);
                return res.send("Session with id '" + id + "' does not exist");
            }
            par.sessions.get(id).tick();
        });

        router.post("/send",function (req,res) {
            if (!req.query.session_id) {
                res.status(400);
                return res.send("Missing 'session_id' argument");
            }
            let id = req.query.session_id;
            if (!req.body) {
                res.status(400);
                return res.send("Post body is empty");
            }
            let o = null;
            if (typeof(req.body) === "object") {
                o = req.body;
            } else {
                o = JSONParse(req.body);
            }
            if (typeof(o) != "object" || Array.isArray(o)) o = null;
            if (!o) {
                res.status(400);
                return res.send("Error reading POST body");
            }
            let s = par.sessions.get(id);
            if (!s) {
                res.status(404);
                return res.send("Session with id '" + id + "' does not exist");
            }
            if (!o.thread) o.thread = s.thread;
            if (!o.d) o.d = null;
            console.log(o);
            par.emit("message",s,o);
            res.send(JSON.stringify({
                status: 1
            }));
        });
        if (ws_ === true) {
            let bd = 'express-ws';
            var expressWs = require(bd)(router);
            router.ws("/ws",function (ws,req) {
                par.handleWS(ws,req);
            });
        }

        return router;
    }

    handleWS(ws,req) {
        let par =this;
        if (!req.query.thread) {
            ws.close(4000,"Error: missing thread attribute");
        }
        let da = {};
        for(let n in req.query) {
            if (n === "thread") continue;
            da[n] = req.query[n];
        }
        let s = par.createWSSession(ws,req.query.thread,da);
    }

}

class Session {
    constructor(thread,id) {
        this.id = id;
        this.thread = thread;
        this.type = "normal";
        this.last_tick = Date.now();

        this.data = {};
        Object.defineProperty(this, 'items', {
            value: [],
            writable: true
        });
    }

    send(type,d,thread) {
        if (!thread) thread = this.thread;
        this.items.push({
            thread: thread,
            type: type,
            d: d
        });
    }
    
    tick() {
        this.last_tick = Date.now();
    }

    get() {
        let r = this.items;
        this.items = [];
        this.tick();
        return r;
    }
}

class WSSession {
    constructor(sessions,ws,thread,id) {
        this.id = id;
        this.thread = thread;
        this.type = "ws";
        this.last_tick = Date.now();

        this.data = {};
        this.encoding = "json";
        Object.defineProperty(this, 'ws', {
            value: ws,
            writable: true
        });
        Object.defineProperty(this, 'sessions', {
            value: sessions
        });
        this.initWS();
    }

    initWS() {
        let par = this;
        if (!this.ws) return;
        this.ws.onmessage = function (e) {
            if (!e.data) return;
            var m = e.data;
            try {m = JSON.parse(m);} catch (erer) {return;}
            if (!m) {return;}
            if (typeof(m) != "object" || Array.isArray(m)) {return;}
            if (!m.type || typeof(m.type) != "string") {return;}
            if (!("d" in m)) {m.d = null;}
            if (!m.thread || (m.thread !== par.thread && m.thread !== "_")) {return;}
            par.onMessage(m);
        };

        this.ws.onclose = function (e) {
            par.sessions.close(par.id);
        };

        this.ws.onerror = function (e) {
            console.log("[Session,WS](" + par.id + "): " + e.message);
            try {
                if (e.cancellable) {
                    return e.cancel();
                }
            } catch (err) {}
            par.sessions.close(par.id);
        };
    }

    init(interval_) {
        interval_ =interval_ - 5000;
        if (interval_ < 0) {
            throw "session interval cannot be inferior to 10'000";
        }
        this.send("init",{
            id: this.id,
            data: this.data,
            interval: interval_
        },"_");
    }

    send(type,d,thread) {
        if (!thread) thread = this.thread;
        let da = {
            thread: thread,
            type: type,
            d: d
        };
        let t = null;
        if (this.encoding == "json") {
            t = JSON.stringify(da);
        } else if (this.encoding == "xml") {
            t = Session.ToXML(da);
        }

        if (!t) return;
        try {
            this.ws.send(t);
        } catch (err) {}
    }

    onMessage(m) {
        if (m.thread == "_") {
            if (m.type == "ping") {
                this.tick();
            }
            return;
        }
        this.sessions.emit("message",this,m);
    }
    
    tick() {
        this.last_tick = Date.now();
    }

    get() {
        return null;
    }

}

module.exports = Sessions;
