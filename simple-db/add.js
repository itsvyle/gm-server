var firstSave,not,base,field_names,key_names;
function onload() {
    not = new gm.NotificationMessages();
    base = gm.base();
    field_names = base.fields.map(function (f) {return f.name;});
    //key_names = base.keyNames.map(function (f) {return f.name;});
    if (base.fields.length < 1) {document.getElementById("add_button").setAttribute("style","display: none;");}
    firstSave = toSave();
    refresh();
}
//fields
function toSaveFields() {
    var trs = document.getElementsByClassName("row-tr");
    var r = [],i,j,jm = field_names.length,im = trs.length,n,t,bf,t,v,e,valid,tr;
    for(i = 0;i < im;i++) {
        tr = trs[i];
        var fields = {};
        valid = true;
        for(j = 0;j < jm;j++) {
            var gotErr = "";
            n = field_names[j];
            t = tr.getElementsByClassName("field-" + n)[0];
            if (!t) {continue;}
            bf = base.fields[j];
            if (!bf) {continue;}
            //fields[n] = t;
            v = t.value;
            e = t.nextSibling;
            if (!v && bf.required && bf.type !== "boolean") {
                gotErr = "This field is required";
            }
            if (!gotErr) {
                if (bf.type === "number") {
                    v = gm.parseInt(v);
                    if (v === null) {
                        gotErr = "This field must contain a number"
                    }
                } else if (bf.type === "boolean") {
                    v = t.checked;
                }
            }
            if (bf.values) {
                if (!bf.values.includes(v)) {
                    gotErr = "This field only accepts the following values: ['" + bf.values.join("', '") + "']";
                }
            }
            
            if (gotErr) {
                if (!t.className.includes("invalid")) {t.className += " invalid";}
                e.innerText = gotErr;
                if (!e.className.includes("visible")) {e.className += " visible";}
                valid = false;
            } else {
                if (e.className.includes("visible")) {e.className = e.className.replaceAll("visible","").trim();}
                if (t.className.includes("invalid")) {t.className = t.className.replaceAll("invalid","").trim();}
                fields[n] = v;
            }
        }
        if (!valid) {
            if (!tr.className.includes("invalid-row")) {
                tr.className += " invalid-row";
                tr.title = "This row is not valid and will not be saved";
            }
        } else {
            tr.className = tr.className.replaceAll("invalid-row","").trim();
            tr.title = "";
            r.push(fields);
        }
    }
    return r;
}

//keys
function toSaveKeys() {
    var container = document.getElementById("keys-container");
    var r = {},i,im = base.keyNames.length,n,t,bf,t,v,e,valid,tr;
    for(i = 0;i < im;i++) {
        var gotErr = "";
        n = base.keyNames[i];
        bf = n;
        n = n.name;
        t = container.getElementsByClassName("key-" + n)[0];
        if (!t) {continue;}
        v = t.value;
        e = t.nextSibling;
        if (!v && bf.required && bf.type !== "boolean") {
            gotErr = "This field is required";
        }
        if (!gotErr) {
            if (bf.type === "number") {
                if (!!v) {
                    v = gm.parseInt(v);
                    if (v === null) {
                        gotErr = "This field must be a number"
                    }
                } else {
                    v = null;
                }
            } else if (bf.type === "boolean") {
                v = t.checked;
            }
        }
        if (bf.values) {
            if (!bf.values.includes(v)) {
                gotErr = "This field only accepts the following values: ['" + bf.values.join("', '") + "']";
            }
        }
        if (gotErr) {
            if (!t.className.includes("invalid")) {t.className += " invalid";}
            e.innerText = gotErr;
            if (!e.className.includes("visible")) {e.className += " visible";}
        } else {
            if (e.className.includes("visible")) {e.className = e.className.replaceAll("visible","").trim();}
            if (t.className.includes("invalid")) {t.className = t.className.replaceAll("invalid","").trim();}
        }
        r[n] = v;
    }
    return r;
}

function toSave() {
    return {
        data: toSaveFields(),
        keys: toSaveKeys(),
    };
}

function newRow() {
    var td,i, tr = gm.newItem("tr","row-tr"),j,jm = base.fields.length,f,cn,def;
    
    for(j = 0;j < jm;j++) {
        f = base.fields[j];
        def = f.default_value;
        cn = "field-" + f.name;
        if (f.type === "boolean") {
            td = gm.newItem("td",{
                style: "text-align: center;"
            },tr);
        } else {
            td = gm.newItem("td",{},tr);
        }

        if (f.values) {
            i = gm.newItem("select",{className: cn,onchange: refresh},td);
            f.values.forEach(function (val) {
                if (typeof(val) == "object") {
                    gm.newItem("option",{
                        value: val.value,
                        innerText: val.label
                    },i);
                } else {
                    gm.newItem("option",{
                        value: val,
                        innerText: val
                    },i);
                }
            });
            if (def) {i.value = def;}
        } else {
            if (f.type === "number") {
                if (!def) {def = "";}
                i = gm.newItem("input",{
                    type: "number",
                    value: def,
                    placeholder: f.placeholder,
                    className: cn,
                    onkeyup: refresh
                },td);
                if (f.required) {i.setAttribute("required","required");}
            } else if (f.type === "boolean") {
                i = gm.newItem("input",{
                    type: "checkbox",
                    className: cn,
                    onclick: refresh,
                    onchange: refresh
                },td);
                if (def === true) {i.checked = true;}
            } else {
                if (!def) {def = "";}
                i = gm.newItem("input",{
                    type: "text",
                    value: def,
                    placeholder: f.placeholder,
                    className: cn,
                    onkeyup: refresh
                },td);
                if (f.required) {i.setAttribute("required","required");}
            }
        }

        gm.newItem("span",{
            className: "error",
            innerText: "This field is invalid"
        },td);
    }


    (function () {
        var bt;
        var td = gm.newItem("td",{style: "width: 1px;"},tr);
        bt = gm.newItem("button",{
            className: "delete-button",
            innerText: "Delete",
            type: "button"
        },td);
        bt.addEventListener("click",function () {deleteRow(bt);});
    })();
    td = gm.newItem("td",{style: "width: 1px;"},tr);
    (function () {
        var bt;
        bt = gm.newItem("button",{
            className: "arrow-button",
            innerHTML: "&uArr;",
            type: "button"
        },td);
        bt.addEventListener("click",function () {swapUp(getRow(bt));;});
    })();

    (function () {
        var bt;
        bt = gm.newItem("button",{
            className: "arrow-button",
            innerHTML: "&dArr;",
            type: "button"
        },td);
        bt.addEventListener("click",function () {swapDown(getRow(bt));;});
    })();

    return tr;
}
function getRow(child) {
    var p = child;
    while (!p.className.includes("row-tr") && p) {
        p = p.parentElement;
    }
    return p;
}
function deleteRow(caller) {
    var p = getRow(caller);
    p.remove();
    refresh();
}

function invalidFieldsCount() {
    return document.querySelectorAll("#table .invalid-row").length;
}

function addRow() {
    var t = document.getElementById("table");
    var te = t.getElementsByTagName("tbody")[0].getElementsByClassName("row-tr")[0];
    var r = newRow();
    if (te) {
        te.parentNode.insertBefore(r,te);
    } else {
        t.appendChild(r);
    }
    setTimeout(refresh,50);
    return r;
}

function refresh() {
    var b = document.getElementById("save_button");
    var t = toSave(),iv = invalidFieldsCount();

    if (iv === 0) {
        if (b.className.includes("has-invalids")) {b.className = b.className.replaceAll("has-invalids","").trim();}
        b.title = "";
        b.innerText = "Save";
    } else {
        if (!b.className.includes("has-invalids")) {b.className += " has-invalids";}
        b.title = "Save data: YOU will loose data";
        b.innerText = "Save - Lossing " + String(iv) + " row" + ((iv > 1) ? "s" : "");
    }

    if (gm.deepEqual(firstSave,t)) {
        b.disabled = true;
    } else {
        b.disabled = false;
    }
}

function save(confirmed) {
    var iv = invalidFieldsCount();
    if (iv > 0 && !confirmed) {
        if (confirm("Are you sure you want to save ?\nYou are lossing " + String(iv) + " row" + ((iv > 1) ? "s that are" : " that is") + " invalid") === true) {
            return save(true);
        } else {
            return;
        }
    }
    document.getElementById("save_button").disabled = true;
    var t = toSave();
    t = JSON.stringify(t);
    gm.request("",{
        method: "POST",
        body: t,
        headers: {
            "content-type": "application/json"
        },
        notifier: not
    },function (r) {
        if (r.status === 1) {
            not.addMessage("Saved data with success",null,3000,true);
            firstSave = toSave();
        }
        refresh();
    });
}

function swapUp(elm) {
    var previous = findPrevious(elm);
    if (previous && previous.className != "no-swap") {
        elm.parentNode.insertBefore(elm, previous);
    }
    refresh();
}


function findPrevious(elm) {
   do {
       elm = elm.previousSibling;
   } while (elm && elm.nodeType != 1);
   return elm;
}

function findNext(elm) {
   do {
       elm = elm.nextSibling;
   } while (elm && elm.nodeType != 1);
   return elm;
}

function swapDown(elem) {
	var prev = findNext(elem);
	if (prev && prev.className != "no-swap") {
		swapUp(prev);
	}
    refresh();
}

gm.onload(onload);
