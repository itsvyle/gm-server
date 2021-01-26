var genID = function (length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

/**
 * A Map with additional utility methods. This is used throughout discord.js rather than Arrays for anything that has
 * an ID, for significantly improved performance and ease-of-use.
 * @extends {Map}
 */
class Collection extends Map {
  constructor(iterable) {
    super(iterable);
        Object.defineProperty(this, 'noDuplicateID', {
            value: false,
            writable: true
        });
        
        Object.defineProperty(this, 'randomIDS', {
            value: [],
            writable: true
        });

  }

    // get(key) {
    //     console.log("Getting: " + key);
    //     return super.get(key);
    // }

    /**
   * Identical to
   * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
   * but returns a Collection instead of an Array.
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {Collection}
   */

    filter(fn, thisArg) {
        if (thisArg) fn = fn.bind(thisArg);
        const results = new Collection();
        for (const [key, val] of this) {
        if (fn(val, key, this)) results.set(key, val);
        }
        return results;
    }

    array() {
        return [...this.values()];
    }
    first() {
        return this.values().next().value;
    }
    
    item(index) {
        if (!index) return;
        return this.array()[index];
    }
    
    createKey() {
        let key = genID(5);
        while(this.has(key) == true || (this.noDuplicateID === true && this.randomIDS.includes(key) === true)) {
            key = genID(le);
            ind += 1;
            if (ind > 50) {
                le += 1;
            }
        }
        return key;
    }

    add(item) {
        let key = this.createKey();
        var ind = 0,le = 5;
        if (this.noDuplicateID) this.randomIDS.push(key);
        this.set(key,item);
        return key;
    }

    setNoDuplicateID(n) {
        this.noDuplicateID = n;
    }

    toObject(primer) {
        const p = (typeof(primer) === "function");
        var ret = {};
        this.forEach((v,k,m) => {ret[k] = (p == true) ? primer(v,k) : v;});
        return ret;
    }

    static withUpdate(clb) {
        return new CollectionWithUpdates(null,clb);
    }
}

class CollectionWithUpdates extends Collection {
    constructor(iterable,onChange) {
        super(iterable);
        if (typeof(onChange) != "function") {onChange = () => {};}
        this.onChange = onChange;
    }

    delete(key) {
        super.delete(key);
        this.onChange();
    }

    set(key,value) {
        super.set(key,value);
        this.onChange();
    }
}

module.exports = Collection;
