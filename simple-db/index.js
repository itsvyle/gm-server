const Util = require("./../util.js");
var replITDB = null;
var baseUI = null;
/**
 * A simple list databse
 */
function treatDBField(f) {
    if (!f) return null;
    if (typeof(f) !== "object") {
        f = {name: f};
    }
    f = Object.assign({
        name: null,
        type: "string",
        primer: null,
        values: null,
        default_value: null,
        required: false,
        stretch: false,
        placeholder: null
    },f);
    if (!f.name) return null;
    if (typeof(f.stretch) === "number") f.stretch += "px;";
    if (typeof(f.placeholder) !== "string") f.placeholder = Util.firstUpper(f.name) + ":";
    if (!!f.primer && typeof(f.primer) !== "function") f.primer = null;
    return f;
}

/**
 * @typedef {Object} DBField
 * @property {string} name
 * @property {string} [ty="string"]
 * @property {Function} [primer=null]
 * @property {Array} [values=null] A list of proposed values
 * @property {any} [default_value=""] The default_value for the field if empty
 * @property {boolean} [required=false]
 * @property {boolean|number} [stretch=false]
 * @property {string} [placeholder=name]
 */

class SimpleDB {

    /**
     * @param {Array<DBField|string>} fields The DB fields
     * @param {string} [replToken=null] Make it false to not use repl.it db
     * @param {string} [dbEntry="simple_db"] The entry id of the data in the database
     * @param {Array<DBField|string>} [keyNames="simple_db"] The keys names
     */
    constructor(fields,replToken,dbEntry = "simple_db",keyNames = []) {
        if (typeof(dbEntry) !== "string") dbEntry = "simple_db";
        if (!Array.isArray(fields)) fields = [];
        this.fields = [];
        this.keyNames = [];
        if (!Array.isArray(keyNames)) keyNames = [];

        for(let f of fields) {
            let t = treatDBField(f);
            if (t) this.fields.push(t);
        }

        for(let f of keyNames) {
            let t = treatDBField(f);
            if (t) this.keyNames.push(t);
        }

        

        if (!this.fields.length) {
            throw "Must provide fields for SimpleDB"
        }
        Object.defineProperty(this,"saveTimer",{writable: true,value: null});
        Object.defineProperty(this,"last_save",{writable: true,value: null});
        Object.defineProperty(this,"db",{writable: true,value: null});

        this.primer = null;

        let bd = "@replit/database";
        if (replToken !== false) {
            if (!replITDB) replITDB = require(bd);
            this.db = new replITDB(replToken);
        }
        Object.defineProperty(this,"map_",{writable: true,value: null});

        /**
         * The field by which to map the data if asked
         * @type {string}
         */
        this.mapBy = null;

        /**
         * The entry name in the database
         * @type {string}
         */
        this.dbEntry = dbEntry;

        /**
         * The db keys, which are single values
         * @type {Object<string,any>}
         */
        this.keys = {};

        /**
         * The db data
         * @type {Array<Objct>}
         */
        this.data = [];

    }

    toSave() {
        return {
            data: this.data,
            keys: this.keys
        };
    }

    get map() {
        if (this.map_ !== null) return this.map_;
        return this.reMap();
    }

    reMap() {
        let par = this;
        if (!this.mapBy) return null;
        this.map_ = this.data.reduce((map, obj,i) => {
            map[obj[this.mapBy]] = obj;
            return map;
        }, {});
        return this.map_;
    }

    start(clb) {
        let par = this;
        if (typeof(clb) !== "function") clb = function () {};
        return this.fetchData().then(function () {
            par.saveTimer = setInterval(function () {par.save();},2500);
            par.map_ = null;
            clb(par);
        }).catch(console.error);
    }

    validateSingleValue(f,v) {
        if (typeof(v) !== f.type) return false;
        if (f.required) {
            if (v === "" && f.type == "string") return false;
        }
        if (f.values) {
            if (!f.values.includes(v)) return false;
        }
        return true;
    }

    validateValue(val) {
        return this.fields.every(f => this.validateSingleValue(f,val[f.name]));
    }
    
    validateData() {
        let fn = this.validateValue.bind(this);
        this.data.filter(fn);
        this.map_ = null;
    }

    fetchData() {
        return new Promise((resolve,reject) => {
            this.db.get(this.dbEntry).then((r) => {
                if (typeof(r) !== "object" || r === null) r = {data: [],keys: {}};
                if (!Array.isArray(r.data)) r.data = [];
                this.data = r.data;
                if (typeof(r.keys) !== "object") r.keys = {};
                this.keys = r.keys;

                this.last_save = this.toSave();
                this.refreshKeys();
                this.map_ = null;
                return resolve(this);
            }).catch(reject);
        });
    }

    refreshKeys() {
        let ns = [];
        for(let k of this.keyNames) {
            let n = k.name;
            if (n in this.keys) {
                if (!this.validateSingleValue(k,this.keys[n])) this.keys[n] = k.default_value;
            } else {
                this.keys[n] = k.default_value;
            }
            ns.push(n);
        }
        for(let n in this.keys) {if (!ns.includes(n)) {delete this.keys[n];}}
    }

    get needsSave() {
        return !Util.deepEqual(this.last_save,this.toSave());
    }

    toSaveIfNeed() {
        let par = this,d = this.toSave();
        if (Util.deepEqual(this.last_save,d) === true) return null;
        return d;
    }

    save(force) {
        let par = this,d = (force === true) ? this.toSave() : this.toSaveIfNeed();
        if (!d) return;
        return this.db.set(this.dbEntry,d).then(() => {par.map_ = null;par.last_save = d;});
    }

    UIHeaders() {
        if (this.fields.length < 1) {
            return '<tr><th style="text-align: center;">No fields are registered</th></tr>'
        }
        let html = ``;
        for(let f of this.fields) {
            if (f.stretch === false) {
                html += `<th style="width: 1px;">`;
            } else if (f.stretch !== true) {
                html += `<th style="${f.stretch}">`;
            } else {html += '<th>';}
            html += `${Util.firstUpper(f.name)}${(f.required === true) ? '<span style="color: red;font-weight: bold;"> *</span>' : ""}${(this.mapBy === f.name) ? '<span style="color: red;font-weight: bold;"> (try unique values)</span>' : ""}</th>`;
        }
        return html + '<th style="width: 1px;"></th><th style="width: 1px;"></th>';
    }

    UIInput(f,value = "",prefix = "field") {
        if (f.type == "number" && value === null) value = "";
        let e = '<span class="error">This field is invalid</e>';
        let re = (f.required) ? " required" : "",cl = `class="${prefix}-${f.name}" placeholder="${f.placeholder}"`;
        if (f.values) {
            let h = '';
            for(let v of f.values) {
                if (typeof(v) == "object") {
                    h += `<option value="${v.value}">${v.label}</option>`;
                } else {
                    h += `<option value="${v}">${v}</option>`;
                }
            }
            return `<select onchange="refresh();" ${cl} value=${value}>${h}</select>` + e;
        }
        if (f.type == "number") {
            return `<input ${cl} type="number" onkeyup="refresh();" value="${value}"${re}>` + e;
        } else if (f.type == "boolean") {
            return `<input ${cl} onchange="refresh();" onclick="refresh();" type="checkbox"${value === true ? ' checked="checked"' : ""}${re}>` + e;
        } else {
            return `<input ${cl} type="text" onkeyup="refresh();" value="${value}"${re}>` + e;
        }
    }

    UIItemRow(vals) {
        let h = '<tr class="row-tr">';
        for(let f of this.fields) {
            if (f.type == "boolean") {
                h += '<td style="text-align: center;">' + this.UIInput(f,vals[f.name]) + "</td>";
            } else {
                h += '<td>' + this.UIInput(f,vals[f.name]) + "</td>";
            }
        }
        return h + `<td style="width: 1px;"><button class="delete-button" type="button" onclick="deleteRow(this);">Delete</button></td><td style="width: 1px;">
                <button type="button" class="arrow-button" onclick="swapUp(getVideoRow(this));">&uArr;</button>
                <button type="button" class="arrow-button" onclick="swapDown(getVideoRow(this));">&dArr;</button>
            </td>` + "</tr>";
    }

    UIKeyRow(keyName,value = "") {
        return `<tr class="key-row-tr"><td style="width: 1px"><p class="key-label">${Util.firstUpper(keyName.name)}${(keyName.required === true) ? '<span style="color: red;font-weight: bold;"> *</span>' : ""}</p></td><td>${this.UIInput(keyName,value,"key")}</td></tr>`;
    }

    UIItems() {
        if (this.fields.length < 1) {
            return '';
        }
        let h = '';
        for(let v of this.data) {
            h += this.UIItemRow(v);
        }
        return h;
    }

    UIKeys() {
        this.refreshKeys();
        let h = '';
        for(let k of this.keyNames) {
            h += this.UIKeyRow(k,this.keys[k.name]);
        }
        return h;
    }

    UI(path = "./") {
        return new Promise((resolve,reject) => {
            if (!baseUI) {
                Util.readFile(__dirname + "/index.html",true).then((d) => {
                    baseUI = d;
                    this.UI().then(resolve).catch(reject);
                }).catch(reject);
            } else {
                let html = baseUI;
                let headers = this.UIHeaders();
                let base = {
                    fields: this.fields,
                    keyNames: this.keyNames
                };

                html = html.replace("{base}",JSON.stringify(base));
                html = html.split("{path}").join(path);
                html = html.replace("{headers}",headers);
                html = html.replace("{items}",this.UIItems());
                html = html.replace("{keys}",this.UIKeys());
                html = html.split("{title}").join((this.dbEntry === "simple_db") ? "" : " - " + this.dbEntry);

                return resolve(html);
            }
        });
    }

    treatData(d) {
        for(let f of this.fields) {
            if (f.primer) d[f.name] = f.primer(d[f.name]);
        }
        if (this.primer) d = this.primer(d);
        return d;
    }

    rePrimer() {
        this.data = this.data.map(d => this.treatData(d));
    }

    setData(d) {
        let par = this;
        if (!Array.isArray(d)) return false;
        d = d.filter(da => this.validateValue(da)).map(da => this.treatData(da));
        this.data = d;
        this.map_ = null;
        return true;
    }

    setKeys(d) {
        if (d === null || typeof(d) !== "object") return false;
        this.keys = d;
        this.refreshKeys();
        return true;
    }

    processPost(req,res) {
        let j = req.body;
        if (!j) {
            res.status(400);
            return res.send("Missing request body");
        }
        if (typeof(j) !== "object") {
            j = gm.JSONParse(j);
            if (j === null) {
                res.status(400);
                return res.send("Invalid request body");
            }
        }
        if (!j.keys || !j.data) {
            res.status(400);
            return res.send("Invalid request (missing params)");
        }
        if (!Array.isArray(j.data)) {
            res.status(400);
            return res.send("Invalid request body.data (must be array)");
        }
        if (typeof(j.keys) !== "object") {
            res.status(400);
            return res.send("Invalid request body.keys (must be object)");
        }
        this.setData(j.data);
        this.setKeys(j.keys);
        res.status(200);
        return res.send("Saved data");
    }

    router(express) {
        let router = express.Router();
        let par = this;
        router.get("/",function (req,res) {
            let p = req.originalUrl;
            if (!p.endsWith("/")) p += "/";
            par.UI(p).then((d) => {res.send(d);}).catch(function (e) {
                console.error(e);
                res.status(500);
                return res.send(Util.errorPage(500,null,e));
            });
        });

        router.post("/",function (req,res) {
            return par.processPost(req,res);
        });

        router.get("/add.js",function (req,res) {
            Util.readFile(__dirname + "/add.js").then((d) => {
                res.send(d);
            }).catch(function (e) {
                res.status(500);
                res.send(e);
            });
        });

        return router;
    }

}

module.exports = SimpleDB;