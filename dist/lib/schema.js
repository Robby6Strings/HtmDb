"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTable = void 0;
var _1 = require(".");
function createTable(tableConfig) {
    var _a;
    return Object.entries(tableConfig.columns).reduce(function (acc, _a) {
        var _b;
        var key = _a[0];
        return __assign(__assign({}, acc), (_b = {}, _b[key] = {
            name: key,
            table: tableConfig.name,
            type: tableConfig.columns[key].type,
        }, _b));
    }, (_a = {}, _a[_1.symbol_internal] = tableConfig, _a));
}
exports.createTable = createTable;
