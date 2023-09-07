"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlDb = exports.symbol_internal = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var url_1 = require("url");
var jsdom_1 = __importDefault(require("jsdom"));
var JSDOM = jsdom_1.default.JSDOM;
exports.symbol_internal = Symbol("_");
var HtmlDb = /** @class */ (function () {
    function HtmlDb(schema) {
        this.schema = schema;
    }
    HtmlDb.prototype.select = function (tableRef, predicates) {
        if (predicates === void 0) { predicates = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var tableStr, dom, table, where, limit, limitSelector, equalityOps, whereSelector, rangeOps, rows, _loop_1, _i, rangeOps_1, op, res_1, res;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readTable(tableRef[exports.symbol_internal].name)];
                    case 1:
                        tableStr = _a.sent();
                        dom = new JSDOM(tableStr);
                        table = dom.window.document.querySelector("table");
                        where = predicates.where, limit = predicates.limit;
                        limitSelector = limit ? ":nth-child(-n+".concat(limit, ")") : "";
                        equalityOps = (where === null || where === void 0 ? void 0 : where.filter(function (w) { return w.operator === "=" || w.operator === "!="; })) || [];
                        whereSelector = equalityOps.length > 0
                            ? equalityOps
                                .map(function (w) {
                                var key = w.key, value = w.value, operator = w.operator;
                                if (operator === "=")
                                    return "[".concat(key.toString(), "=\"").concat(value, "\"]");
                                if (operator === "!=")
                                    return ":not([".concat(key.toString(), "=\"").concat(value, "\"])");
                            })
                                .join("")
                            : "";
                        rangeOps = (where === null || where === void 0 ? void 0 : where.filter(function (w) { return w.operator !== "=" && w.operator !== "!="; })) || [];
                        if (rangeOps.length > 0) {
                            rows = Array.from(table.querySelectorAll("tr"));
                            _loop_1 = function (op) {
                                var key = op.key, value = op.value, operator = op.operator;
                                rows = rows.filter(function (row) {
                                    var rowVal = key === "id" ? row.id : row.getAttribute(key.toString());
                                    if (!rowVal)
                                        return false;
                                    if (operator === ">")
                                        return parseInt(rowVal) > parseInt(value);
                                    if (operator === "<")
                                        return parseInt(rowVal) < parseInt(value);
                                    if (operator === ">=")
                                        return parseInt(rowVal) >= parseInt(value);
                                    if (operator === "<=")
                                        return parseInt(rowVal) <= parseInt(value);
                                });
                            };
                            for (_i = 0, rangeOps_1 = rangeOps; _i < rangeOps_1.length; _i++) {
                                op = rangeOps_1[_i];
                                _loop_1(op);
                            }
                            res_1 = rows.map(function (row) { return _this.rowToKv(row); });
                            if (limit)
                                return [2 /*return*/, res_1.slice(0, limit)];
                            return [2 /*return*/, res_1];
                        }
                        res = Array.from(table.querySelectorAll("tr".concat(whereSelector).concat(limitSelector))).map(function (row) { return _this.rowToKv(row); });
                        return [2 /*return*/, res];
                }
            });
        });
    };
    HtmlDb.prototype.upsert = function (tableRef, rows, returnRows) {
        if (returnRows === void 0) { returnRows = false; }
        return __awaiter(this, void 0, void 0, function () {
            var tableStr, document, table, res, _i, rows_1, item, row, _a, _b, _c, key, value, newRow, _d, _e, _f, key, value;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, this.readTable(tableRef[exports.symbol_internal].name)];
                    case 1:
                        tableStr = _g.sent();
                        document = new JSDOM(tableStr).window.document;
                        table = document.querySelector("table");
                        res = [];
                        for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                            item = rows_1[_i];
                            if ("id" in item) {
                                row = document.getElementById(item.id);
                                if (row) {
                                    for (_a = 0, _b = Object.entries(item); _a < _b.length; _a++) {
                                        _c = _b[_a], key = _c[0], value = _c[1];
                                        if (key === "id")
                                            continue;
                                        row.setAttribute(key, value.toString());
                                    }
                                    if (returnRows)
                                        res.push(this.rowToKv(row));
                                    continue;
                                }
                            }
                            newRow = document.createElement("tr");
                            for (_d = 0, _e = Object.entries(item); _d < _e.length; _d++) {
                                _f = _e[_d], key = _f[0], value = _f[1];
                                if (key === "id") {
                                    newRow.id = value.toString();
                                    continue;
                                }
                                newRow.setAttribute(key, value.toString());
                            }
                            table.appendChild(newRow);
                            if (returnRows)
                                res.push(this.rowToKv(newRow));
                        }
                        return [4 /*yield*/, this.writeTable(tableRef[exports.symbol_internal].name, table)];
                    case 2:
                        _g.sent();
                        return [2 /*return*/, returnRows ? res : undefined];
                }
            });
        });
    };
    HtmlDb.prototype.rowToKv = function (row) {
        return Array.from(row.attributes).reduce(function (acc, _a) {
            var name = _a.name, value = _a.value;
            acc[name] = value;
            return acc;
        }, {});
    };
    HtmlDb.prototype.fileUrlFromTableName = function (tableName) {
        return (0, url_1.pathToFileURL)(path_1.default.join("tables", tableName + ".html"));
    };
    HtmlDb.prototype.readTable = function (tableName) {
        return fs_1.default.promises.readFile(this.fileUrlFromTableName(tableName), "utf8");
    };
    HtmlDb.prototype.writeTable = function (tableName, tableElement) {
        return fs_1.default.promises.writeFile(this.fileUrlFromTableName(tableName), tableElement.outerHTML);
    };
    return HtmlDb;
}());
exports.HtmlDb = HtmlDb;
