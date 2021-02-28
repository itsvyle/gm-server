class Flags {
    constructor(vals,flags_) {
        if (typeof(vals) !== "object" || !vals) {throw "'vals' must be an object";}
    
        this.flag_values = {};
        for(var n_ in vals) {
            var v_ = vals[n_];
            if (typeof(v_) !== "number") {continue;}
            this.flag_values[n_] = (1 << v_);
        }
        
        this.flags = (typeof(flags_) === "number") ? flags_ : 0;
    }

    add(flag) {
        var par = this;
        if (Array.isArray(flag)) {
            return flag.every(function (f) {
                return par.add(f);
            });
        }
        if (!flag || typeof(flag) !== "string") {throw "'flag' must be a string";}
        if (!(flag in this.flag_values)) {return false;}
        this.flags |= this.flag_values[flag];
        return true;
    }

    has(flag) {
        var par = this;
        if (Array.isArray(flag)) {
            return flag.every(function (f) {
                return par.has(f);
            });
        }
        if (!flag || typeof(flag) !== "string") {throw "'flag' must be a string";}
        if (!(flag in this.flag_values)) {return false;}
        flag = this.flag_values[flag];
        return ((this.flags & flag) === flag);
    }

    remove(flag) {
        var par = this;
        if (Array.isArray(flag)) {
            return flag.every(function (f) {
                return par.remove(f);
            });
        }
        if (!flag || typeof(flag) !== "string") {throw "'flag' must be a string";}
        if (!(flag in this.flag_values)) {return false;}
        flag = this.flag_values[flag];
        this.flags &= ~flag;
        return true;
    }

    array() {
        var r = [];
        for(var f in this.flag_values) {
            if (this.has(f)) {r.push(f);}
        }
        return r;
    }

    object() {
        var r = {};
        for(var f in this.flag_values) {
            r[f] = this.has(f);
        }
        return r;
    }

    setFlags(f) {
        if (typeof(f) !== "number") {throw("'f' must be a number");}
        this.flags = f;
    }

    set(flag,val) {
        if (val === true) {
            this.add(flag);
        } else if (val === false) {
            this.remove(flag);
        }
    }

    fromObject(o) {
        if (!o || typeof(o) !== "object") {return false;}
        for(var n in o) {
            if (!(n in this.flag_values)) {continue;}
            this.set(n,o[n]);
        }
    }

    addall() {
        for(var f in this.flag_values) {
            this.flags |= this.flag_values[f];
        }
    }

    toString() {
        return String(this.flags);
    }
}

module.exports = Flags;
