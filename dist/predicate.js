"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lte = exports.gte = exports.lt = exports.gt = exports.notEq = exports.eq = void 0;
var eq = function (a, b) {
    return {
        key: a,
        value: b,
        operator: "=",
    };
};
exports.eq = eq;
var notEq = function (a, b) {
    return {
        key: a,
        value: b,
        operator: "!=",
    };
};
exports.notEq = notEq;
var gt = function (a, b) {
    return {
        key: a,
        value: b,
        operator: ">",
    };
};
exports.gt = gt;
var lt = function (a, b) {
    return {
        key: a,
        value: b,
        operator: "<",
    };
};
exports.lt = lt;
var gte = function (a, b) {
    return {
        key: a,
        value: b,
        operator: ">=",
    };
};
exports.gte = gte;
var lte = function (a, b) {
    return {
        key: a,
        value: b,
        operator: "<=",
    };
};
exports.lte = lte;
