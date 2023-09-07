"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lte = exports.gte = exports.lt = exports.gt = exports.notEq = exports.eq = void 0;
var eq = function (key, val) {
    return createPredicate(key, val, "=");
};
exports.eq = eq;
var notEq = function (key, val) {
    return createPredicate(key, val, "!=");
};
exports.notEq = notEq;
var gt = function (key, val) {
    return createPredicate(key, val, ">");
};
exports.gt = gt;
var lt = function (key, val) {
    return createPredicate(key, val, "<");
};
exports.lt = lt;
var gte = function (key, val) {
    return createPredicate(key, val, ">=");
};
exports.gte = gte;
var lte = function (key, val) {
    return createPredicate(key, val, "<=");
};
exports.lte = lte;
function createPredicate(key, value, operator) {
    return {
        key: key,
        value: value,
        operator: operator,
    };
}
