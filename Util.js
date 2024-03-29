/* eslint no-extend-native: ["error", { "exceptions": ["Array", "Object"] }] */
Object.filter = function (obj, predicate) {
  return Object.fromEntries(Object.entries(obj).filter(predicate))
}

Array.prototype.clear = function () {
  this.splice(0, this.length)
}

const Util = {}
export default Util

Util.trim = function (string) {
  return string.trim()
}

Util.keyRegex = function (regex) {
  return ([key]) => key.match(regex)
}
Util.isP = function (x) {
  return !!x && Util.isF(x.then)
}

Util.isF = function (x) {
  return typeof x === 'function'
}

Util.isAF = function (x) {
  return Util.isF(x) && x.constructor.name === 'AsyncFunction'
}

Util.til = function (p) {
  return Promise.resolve(p).then(
    (r) => ({ ok: r, error: undefined }),
    (e) => ({ ok: undefined, error: e })
  )
}

Util.anyToString = function (valueToConvert) {
    if (valueToConvert === undefined || valueToConvert === null) {
        return valueToConvert === undefined ? "undefined" : "null";
    }
    if (typeof valueToConvert === "string") {
        return `'${valueToConvert}'`;
    }
    if (typeof valueToConvert === "number" ||
        typeof valueToConvert === "boolean" ||
        typeof valueToConvert === "function") {
        return valueToConvert.toString();
    }
    if (valueToConvert instanceof Array) {
        const stringfiedArray = valueToConvert
            .map(property => anyToString(property))
            .join(",");
        return `[${stringfiedArray}]`;
    }
    if (typeof valueToConvert === "object") {
        const stringfiedObject = Object.entries(valueToConvert)
            .map((entry) => {
            return `${entry[0]}: ${anyToString(entry[1])}`;
        })
            .join(",");
        return `{${stringfiedObject}}`;
    }
    return JSON.stringify(valueToConvert);
}