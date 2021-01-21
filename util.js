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


function JSONParse(text) {try {return JSON.parse(text);} catch (err) {return null;}}

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
    }
};
