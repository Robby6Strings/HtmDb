"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lte = exports.gte = exports.lt = exports.gt = exports.neq = exports.eq = void 0;
var eq = function (a, b) {
    return createPredicate(a, b, "=");
};
exports.eq = eq;
var neq = function (a, b) {
    return createPredicate(a, b, "!=");
};
exports.neq = neq;
var gt = function (a, b) {
    return createPredicate(a, b, ">");
};
exports.gt = gt;
var lt = function (a, b) {
    return createPredicate(a, b, "<");
};
exports.lt = lt;
var gte = function (a, b) {
    return createPredicate(a, b, ">=");
};
exports.gte = gte;
var lte = function (a, b) {
    return createPredicate(a, b, "<=");
};
exports.lte = lte;
function createPredicate(a, b, operator) {
    return {
        a: a,
        b: b,
        operator: operator,
    };
}
