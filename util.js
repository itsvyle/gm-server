if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function (search,replace) {
		return this.split(search).join(replace);
	};
}

const nl = `
`;
var escaping = {
	attribute: function (str) {return str.replaceAll('<',"&lt;").replaceAll('&',"&amp;").replaceAll('"',"&quot;").replaceAll("'","&apos;");},
	content: function (str){return str.replaceAll('<',"&lt;").replaceAll('&',"&amp;");}
};

function JSONToXML(json) {
	return _JSONToXML("xml",json).trim();
}

function _JSONToXML(key,value) {
	var r = `<${key} `;
	var inner = "";
	if (!typeof(value)) {return "";}
	if (Array.isArray(value)) {
		for(let item of value) {
			inner += _JSONToXML("item",item);
		}
	} else if (value == null) {
    } else if (typeof(value) == "object") {
		for(let k in value) {
			let v = value[k];
            if (v == null) {continue;}
			if (typeof(v) == "boolean") {v = (v === true) ? 1 : 0;}
			if (!typeof(v)) {continue;}
			if (typeof(v) == "string" || typeof(v) == "number") {
				r += `${k}="${escaping.attribute(String(v))}" `;
			} else if (Array.isArray(v)) {
				inner += nl + _JSONToXML(k,v);
			} else if (typeof(v) == "object") {
				inner += nl + _JSONToXML(k,v);
			}
		}
	} else {
		if (typeof(value) == "boolean") {value = (value === true) ? 1 : 0;}
		if (typeof(value) == "string" || typeof(value) == "number") {
			inner = escaping.content(value);
		}
	}
	return r.trim() + ">" + inner + `</${key}>` + nl;
}


function JSONParse(text) {try {return JSON.parse(text);} catch (err) {
    console.log(err);
    return null;}}

module.exports = {
    toXML: JSONToXML,
    JSONParse: JSONParse,
    parseInt: function(s) {
		var r = parseInt(s);
		if (isNaN(r)) {return null;}
		return r;
	},
    debug: function (s) {
        console.log(s);
        return false;
    },
    classToJSON: function (obj) {
        var res = {};
        var ks = Object.keys(obj)
                .filter( key => !key.endsWith("_"));
        let par = this;
        ks.forEach((k) => {
            let v = obj[k];
            if (v === undefined) v = null;
            if (v!== null && typeof(v) == "object") {v = this.classToJSON(v);}
            res[k] = v;
        });
        return res;
    },
    projectURL: "https://remote.lfny.repl.co",
    request: function (request,opts,clb) {
        if (typeof(clb) !== "function") clb = () => {};
        if (!request) return clb({status: 0,error: "Request must be an imported request npm instance"});
        if (!opts.url) return clb({status: 0,error: "'opts' must be an object with a 'url' property"});
        let url = opts.url;
        delete opts['url'];
        request(url,opts,function (error, response, body) {
            if (!error && response.statusCode == 200) {
				clb({
					status: 1,
					code: response.statusCode,
					body: body
				});
			} else {
				clb({
					status: 0,
					error: error || body,
					code: response.statusCode
				});
			}
        });
    },
    sortBy: function() {
        var fields = [].slice.call(arguments),
            n_fields = fields.length;

        return function(A,B) {
            var a, b, field, key, primer, reverse, result, i;

            for(i = 0; i < n_fields; i++) {
                result = 0;
                field = fields[i];

                key = typeof(field) === 'string' ? field : field.name;

                a = A[key];
                b = B[key];

                if (typeof(field.primer)  !== 'undefined'){
                    a = field.primer(a);
                    b = field.primer(b);
                }

                reverse = (field.reverse) ? -1 : 1;

                if (a<b){result = reverse * -1};
                if (a>b){result = reverse * 1};
                if(result !== 0) {break;}
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
    formatTime: function (milliseconds) {
        if (typeof(milliseconds) != "number") {return milliseconds;}
        if (milliseconds >= (3600 * 24 * 1000)) {//more than a day
            return `${Math.floor(milliseconds / (1000 * 60 * 60 * 24))}d ${Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h ${Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))}m ${Math.floor((milliseconds % (1000 * 60)) / 1000)}s`;
        } else if (milliseconds >= 3600 * 1000) {
            return `${Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h ${Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))}m ${Math.floor((milliseconds % (1000 * 60)) / 1000)}s`;
        } else if (milliseconds >= 60 * 1000) {
            return `${Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))}m ${Math.floor((milliseconds % (1000 * 60)) / 1000)}s`;
        } else {
            return String(milliseconds) + "s";
        }
    },
	UTCTime: function (d1) {
		if (!d1) {d1 = new Date();}
        var now = new Date(d1.getUTCFullYear(),d1.getUTCMonth(),d1.getUTCDate(),d1.getUTCHours(),d1.getUTCMinutes(),d1.getUTCSeconds(),d1.getUTCMilliseconds());
        return now.getTime();
	},
    deepEqual: function (object1, object2) {
        var isObject = function (object) {return (object != null && typeof object === 'object');};
        var keys1 = Object.keys(object1);
        var keys2 = Object.keys(object2);

        if (keys1.length !== keys2.length) {
            return false;
        }
        for(var i = i;i < keys1.length;i++) {
            var key = keys1[i];
            var val1 = object1[key];
            var val2 = object2[key];
            var areObjects = isObject(val1) && isObject(val2);
            if (areObjects && !gm.deepEqual(val1, val2) || !areObjects && val1 !== val2
            ) {return false;}
        }
        return true;
    },
    generateID: function (length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    express: function ({port,post,express}) {
        if (!express) express = require("express");
        if (!port) port = 3000;
        if (!post) post = false;

        var app = express();
        if (post === true) {
            var bodyParser = require('body-parser');
            app.use(bodyParser.json({limit: "50mb"}));
            app.use(bodyParser.urlencoded({limit: "50mb",extended: true}));
        }
        app.connect = function (clb) {
            if (clb === true) clb = () => {console.log("App listening at port: " + port);};
            if (typeof(clb) !== "function") {clb = () => {};}
            app.listen(port,() => {clb();});
        };
        return app;
    },
    parseCookies:function (rc) {
        var list = {};//rc = request.headers.cookie;

        rc && rc.split(';').forEach(function( cookie ) {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });

        return list;
    }
};
