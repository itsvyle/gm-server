"use strict";
var genID = function (length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Collection = void 0;
/**
 * A Map with additional utility methods. This is used than Arrays for anything that has
 * an ID, for significantly improved performance and ease-of-use.
 * This is a modified version of [@discordjs/Collection](https://github.com/discordjs/collection) by [@itsvyle](https://github.com/itsvyle)
 * @extends {Map}
 * @property {number} size - The amount of elements in this collection.
 */
class Collection extends Map {
	constructor(entries) {
		super(entries);
		/**
		 * Cached array for the `array()` method - will be reset to `null` whenever `set()` or `delete()` are called
		 * @name Collection#_array
		 * @type {?Array}
		 * @private
		 */
		Object.defineProperty(this, '_array', {
			value: null,
			writable: true,
			configurable: true
		});
		/**
		 * Cached array for the `keyArray()` method - will be reset to `null` whenever `set()` or `delete()` are called
		 * @name Collection#_keyArray
		 * @type {?Array}
		 * @private
		 */
		Object.defineProperty(this, '_keyArray', {
			value: null,
			writable: true,
			configurable: true
		});

		/**
		 * Cached values for unique ids, used for the `add` method
		 * @type {?Array<string>}
		 * @private
		*/
		Object.defineProperty(this, '_uniqueIDS', {
			value: [],
			writable: true,
			configurable: true
		});
		
		/**
		 * @depreciated
		*/
		Object.defineProperty(this, 'noDuplicateID', {
            value: false,
            writable: true
        });
	}
	
	/**
	 * Creates a unique `key` to use before the `add` method
	 * @param {number} [min_length=5] - The minimum length of the `key`
	 * @returns {string}
	*/
	createKey(min_length = 5) {
		let len = min_length || 5;
		let i = 0, k = genID(len);
		while (this._uniqueIDS.includes(k) || this.has(k)) {
			k = genID(len);
			i++;
			if (i >= 40) {
				i = 0;
				len++;
			}
		}
		this._uniqueIDS.push(k);
		return k;
	}

	/**
	 * Sets a new element in the collection with the specified value and a randomely generated key.
	 * @param {*} value - The value of the element to add
	 * @params {number} [minKeyLength=5] - The minimum length of the generated `key`
	 * @returns {string} The new item's key
	*/
	add(value,minKeyLength = null) {
		let k = this.createKey(minKeyLength);
		this.set(k,value);
		return k;
	}

	/**
	 * Identical to [Map.get()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get).
	 * Gets an element with the specified key, and returns its value, or `undefined` if the element does not exist.
	 * @param {*} key - The key to get from this collection
	 * @returns {* | undefined}
	 */
	get(key) {
		return super.get(key);
	}
	/**
	 * Identical to [Map.set()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set).
	 * Sets a new element in the collection with the specified key and value.
	 * @param {*} key - The key of the element to add
	 * @param {*} value - The value of the element to add
	 * @returns {Collection}
	 */
	set(key, value) {
		this._array = null;
		this._keyArray = null;
		return super.set(key, value);
	}
	/**
	 * Identical to [Map.has()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has).
	 * Checks if an element exists in the collection.
	 * @param {*} key - The key of the element to check for
	 * @returns {boolean} `true` if the element exists, `false` if it does not exist.
	 */
	has(key) {
		return super.has(key);
	}
	/**
	 * Identical to [Map.delete()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/delete).
	 * Deletes an element from the collection.
	 * @param {*} key - The key to delete from the collection
	 * @returns {boolean} `true` if the element was removed, `false` if the element does not exist.
	 */
	delete(key) {
		this._array = null;
		this._keyArray = null;
		return super.delete(key);
	}
	/**
	 * Identical to [Map.clear()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/clear).
	 * Removes all elements from the collection.
	 * @returns {undefined}
	 */
	clear() {
		return super.clear();
	}
	/**
	 * Creates an ordered array of the values of this collection, and caches it internally. The array will only be
	 * reconstructed if an item is added to or removed from the collection, or if you change the length of the array
	 * itself. If you don't want this caching behavior, use `[...collection.values()]` or
	 * `Array.from(collection.values())` instead.
	 * @returns {Array}
	 */
	array() {
		if (!this._array || this._array.length !== this.size)
			this._array = [...this.values()];
		return this._array;
	}
	/**
	 * Creates an ordered array of the keys of this collection, and caches it internally. The array will only be
	 * reconstructed if an item is added to or removed from the collection, or if you change the length of the array
	 * itself. If you don't want this caching behavior, use `[...collection.keys()]` or
	 * `Array.from(collection.keys())` instead.
	 * @returns {Array}
	 */
	keyArray() {
		if (!this._keyArray || this._keyArray.length !== this.size)
			this._keyArray = [...this.keys()];
		return this._keyArray;
	}
	/**
	 * Obtains the first value(s) in this collection.
	 * @param {number} [amount] Amount of values to obtain from the beginning
	 * @returns {*|Array<*>} A single value if no amount is provided or an array of values, starting from the end if
	 * amount is negative
	 */
	first(amount) {
		if (typeof amount === 'undefined')
			return this.values().next().value;
		if (amount < 0)
			return this.last(amount * -1);
		amount = Math.min(this.size, amount);
		const iter = this.values();
		return Array.from({
			length: amount
		}, () => iter.next().value);
	}
	/**
	 * Obtains the first key(s) in this collection.
	 * @param {number} [amount] Amount of keys to obtain from the beginning
	 * @returns {*|Array<*>} A single key if no amount is provided or an array of keys, starting from the end if
	 * amount is negative
	 */
	firstKey(amount) {
		if (typeof amount === 'undefined')
			return this.keys().next().value;
		if (amount < 0)
			return this.lastKey(amount * -1);
		amount = Math.min(this.size, amount);
		const iter = this.keys();
		return Array.from({
			length: amount
		}, () => iter.next().value);
	}
	/**
	 * Obtains the last value(s) in this collection. This relies on {@link Collection#array}, and thus the caching
	 * mechanism applies here as well.
	 * @param {number} [amount] Amount of values to obtain from the end
	 * @returns {*|Array<*>} A single value if no amount is provided or an array of values, starting from the start if
	 * amount is negative
	 */
	last(amount) {
		const arr = this.array();
		if (typeof amount === 'undefined')
			return arr[arr.length - 1];
		if (amount < 0)
			return this.first(amount * -1);
		if (!amount)
			return [];
		return arr.slice(-amount);
	}
	/**
	 * Obtains the last key(s) in this collection. This relies on {@link Collection#keyArray}, and thus the caching
	 * mechanism applies here as well.
	 * @param {number} [amount] Amount of keys to obtain from the end
	 * @returns {*|Array<*>} A single key if no amount is provided or an array of keys, starting from the start if
	 * amount is negative
	 */
	lastKey(amount) {
		const arr = this.keyArray();
		if (typeof amount === 'undefined')
			return arr[arr.length - 1];
		if (amount < 0)
			return this.firstKey(amount * -1);
		if (!amount)
			return [];
		return arr.slice(-amount);
	}
	/**
	 * Obtains unique random value(s) from this collection. This relies on {@link Collection#array}, and thus the caching
	 * mechanism applies here as well.
	 * @param {number} [amount] Amount of values to obtain randomly
	 * @returns {*|Array<*>} A single value if no amount is provided or an array of values
	 */
	random(amount) {
		let arr = this.array();
		if (typeof amount === 'undefined')
			return arr[Math.floor(Math.random() * arr.length)];
		if (arr.length === 0 || !amount)
			return [];
		arr = arr.slice();
		return Array.from({
			length: amount
		}, () => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
	}
	/**
	 * Obtains unique random key(s) from this collection. This relies on {@link Collection#keyArray}, and thus the caching
	 * mechanism applies here as well.
	 * @param {number} [amount] Amount of keys to obtain randomly
	 * @returns {*|Array<*>} A single key if no amount is provided or an array
	 */
	randomKey(amount) {
		let arr = this.keyArray();
		if (typeof amount === 'undefined')
			return arr[Math.floor(Math.random() * arr.length)];
		if (arr.length === 0 || !amount)
			return [];
		arr = arr.slice();
		return Array.from({
			length: amount
		}, () => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
	}
	/**
	 * Searches for a single item where the given function returns a truthy value. This behaves like
	 * [Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
	 * <warn>All collections used in Discord.js are mapped using their `id` property, and if you want to find by id you
	 * should use the `get` method. See
	 * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>
	 * @param {Function} fn The function to test with (should return boolean)
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {*}
	 * @example collection.find(city => city.country === "United States");
	 */
	find(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		for (const [key, val] of this) {
			if (fn(val, key, this))
				return val;
		}
		return undefined;
	}
	/**
	 * Searches for the key of a single item where the given function returns a truthy value. This behaves like
	 * [Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex),
	 * but returns the key rather than the positional index.
	 * @param {Function} fn The function to test with (should return boolean)
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {*}
	 * @example collection.findKey(city => city.name === "New York");
	 */
	findKey(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		for (const [key, val] of this) {
			if (fn(val, key, this))
				return key;
		}
		return undefined;
	}
	/**
	 * Removes items that satisfy the provided filter function.
	 * @param {Function} fn Function used to test (should return a boolean)
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {number} The number of removed entries
	 */
	sweep(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		const previousSize = this.size;
		for (const [key, val] of this) {
			if (fn(val, key, this))
				this.delete(key);
		}
		return previousSize - this.size;
	}
	/**
	 * Identical to
	 * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
	 * but returns a Collection instead of an Array.
	 * @param {Function} fn The function to test with (should return boolean)
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {Collection}
	 * @example collection.filter(city => city.country === "United States");
	 */
	filter(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		const results = new this.constructor[Symbol.species]();
		for (const [key, val] of this) {
			if (fn(val, key, this))
				results.set(key, val);
		}
		return results;
	}
	/**
	 * Partitions the collection into two collections where the first collection
	 * contains the items that passed and the second contains the items that failed.
	 * @param {Function} fn Function used to test (should return a boolean)
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {Collection[]}
	 * @example const [europe,other] = collection.partition(country => country.continent === "Europe");
	 */
	partition(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		// TODO: consider removing the <K, V> from the constructors after TS 3.7.0 is released, as it infers it
		const results = [new this.constructor[Symbol.species](), new this.constructor[Symbol.species]()];
		for (const [key, val] of this) {
			if (fn(val, key, this)) {
				results[0].set(key, val);
			} else {
				results[1].set(key, val);
			}
		}
		return results;
	}
	/**
	 * Maps each item into a Collection, then joins the results into a single Collection. Identical in behavior to
	 * [Array.flatMap()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap).
	 * @param {Function} fn Function that produces a new Collection
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {Collection}
	 * @example collection.flatMap(country => country.inhabitants);
	 */
	flatMap(fn, thisArg) {
		const collections = this.map(fn, thisArg);
		return new this.constructor[Symbol.species]().concat(...collections);
	}
	/**
	 * Maps each item to another value into an array. Identical in behavior to
	 * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
	 * @param {Function} fn Function that produces an element of the new array, taking three arguments
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {Array}
	 * @example collection.map(country => country.capital);
	 */
	map(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		const iter = this.entries();
		return Array.from({
			length: this.size
		}, () => {
			const [key, value] = iter.next().value;
			return fn(value, key, this);
		});
	}
	/**
	 * Maps each item to another value into a collection. Identical in behavior to
	 * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
	 * @param {Function} fn Function that produces an element of the new collection, taking three arguments
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {Collection}
	 * @example collection.mapValues(country => country.inhabitants);
	 */
	mapValues(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		const coll = new this.constructor[Symbol.species]();
		for (const [key, val] of this)
			coll.set(key, fn(val, key, this));
		return coll;
	}
	/**
	 * Checks if there exists an item that passes a test. Identical in behavior to
	 * [Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
	 * @param {Function} fn Function used to test (should return a boolean)
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {boolean}
	 * @example collection.some(country => country.altitude > 1000);
	 */
	some(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		for (const [key, val] of this) {
			if (fn(val, key, this))
				return true;
		}
		return false;
	}
	/**
	 * Checks if all items passes a test. Identical in behavior to
	 * [Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
	 * @param {Function} fn Function used to test (should return a boolean)
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {boolean}
	 * @example collection.every(country => !country.stillExists);
	 */
	every(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		for (const [key, val] of this) {
			if (!fn(val, key, this))
				return false;
		}
		return true;
	}
	/**
	 * Applies a function to produce a single value. Identical in behavior to
	 * [Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).
	 * @param {Function} fn Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`,
	 * and `collection`
	 * @param {*} [initialValue] Starting value for the accumulator
	 * @returns {*}
	 * @example collection.reduce((acc,country) => acc + country.inhabitants,0);
	 */
	reduce(fn, initialValue) {
		let accumulator;
		if (typeof initialValue !== 'undefined') {
			accumulator = initialValue;
			for (const [key, val] of this)
				accumulator = fn(accumulator, val, key, this);
			return accumulator;
		}
		let first = true;
		for (const [key, val] of this) {
			if (first) {
				accumulator = val;
				first = false;
				continue;
			}
			accumulator = fn(accumulator, val, key, this);
		}
		// No items iterated.
		if (first) {
			throw new TypeError('Reduce of empty collection with no initial value');
		}
		return accumulator;
	}
	/**
	 * Identical to
	 * [Map.forEach()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach),
	 * but returns the collection instead of undefined.
	 * @param {Function} fn Function to execute for each element
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {Collection}
	 */
	each(fn, thisArg) {
		this.forEach(fn, thisArg);
		return this;
	}
	/**
	 * Runs a function on the collection and returns the collection.
	 * @param {Function} fn Function to execute
	 * @param {*} [thisArg] Value to use as `this` when executing function
	 * @returns {Collection}
	 * @example collection.tap(collection_ => console.log(collection_.size));
	 */
	tap(fn, thisArg) {
		if (typeof thisArg !== 'undefined')
			fn = fn.bind(thisArg);
		fn(this);
		return this;
	}
	/**
	 * Creates an identical shallow copy of this collection.
	 * @returns {Collection}
	 * @example const newColl = someColl.clone();
	 */
	clone() {
		return new this.constructor[Symbol.species](this);
	}
	/**
	 * Combines this collection with others into a new collection. None of the source collections are modified.
	 * @param {...Collection} collections Collections to merge
	 * @returns {Collection}
	 * @example const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
	 */
	concat(...collections) {
		const newColl = this.clone();
		for (const coll of collections) {
			for (const [key, val] of coll)
				newColl.set(key, val);
		}
		return newColl;
	}
	/**
	 * Checks if this collection shares identical items with another.
	 * This is different to checking for equality using equal-signs, because
	 * the collections may be different objects, but contain the same data.
	 * @param {Collection} collection Collection to compare with
	 * @returns {boolean} Whether the collections have identical contents
	 */
	equals(collection) {
		if (!collection)
			return false;
		if (this === collection)
			return true;
		if (this.size !== collection.size)
			return false;
		for (const [key, value] of this) {
			if (!collection.has(key) || value !== collection.get(key)) {
				return false;
			}
		}
		return true;
	}
	/**
	 * The sort method sorts the items of a collection in place and returns it.
	 * The sort is not necessarily stable in Node 10 or older.
	 * The default sort order is according to string Unicode code points.
	 * @param {Function} [compareFunction] Specifies a function that defines the sort order.
	 * If omitted, the collection is sorted according to each character's Unicode code point value,
	 * according to the string conversion of each element.
	 * @returns {Collection}
	 * @example collection.sort((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
	 */
	sort(compareFunction = (x, y) => Number(x > y) || Number(x === y) - 1) {
		const entries = [...this.entries()];
		entries.sort((a, b) => compareFunction(a[1], b[1], a[0], b[0]));
		// Perform clean-up
		super.clear();
		this._array = null;
		this._keyArray = null;
		// Set the new entries
		for (const [k, v] of entries) {
			super.set(k, v);
		}
		return this;
	}
	/**
	 * The intersect method returns a new structure containing items where the keys are present in both original structures.
	 * @param {Collection} other The other Collection to filter against
	 * @returns {Collection}
	 */
	intersect(other) {
		return other.filter((_, k) => this.has(k));
	}
	/**
	 * The difference method returns a new structure containing items where the key is present in one of the original structures but not the other.
	 * @param {Collection} other The other Collection to filter against
	 * @returns {Collection}
	 */
	difference(other) {
		return other.filter((_, k) => !this.has(k)).concat(this.filter((_, k) => !other.has(k)));
	}
	/**
	 * The sorted method sorts the items of a collection and returns it.
	 * The sort is not necessarily stable in Node 10 or older.
	 * The default sort order is according to string Unicode code points.
	 * @param {Function} [compareFunction] Specifies a function that defines the sort order.
	 * If omitted, the collection is sorted according to each character's Unicode code point value,
	 * according to the string conversion of each element.
	 * @returns {Collection}
	 * @example collection.sorted((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
	 */
	sorted(compareFunction = (x, y) => Number(x > y) || Number(x === y) - 1) {
		return new this.constructor[Symbol.species]([...this.entries()])
			.sort((av, bv, ak, bk) => compareFunction(av, bv, ak, bk));
	}
	
	/**
	 * Returns the collection as an object
	 * @param {Function} [fn] - A function to transform the collection's elements
	 * @returns {Object}
	*/
	toObject(fn = null) {
		let r = {};
		this.forEach((val,key) => r[key] = ((fn) ? fn(val,key) : val));
		return r;
	}
}
exports.Collection = Collection;
Collection.default = Collection;
if (typeof window === "undefined") {
	module.exports = Collection;
}
exports.default = Collection;
