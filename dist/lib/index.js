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
exports.HtmlDb = exports.join = exports.symbol_internal = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var url_1 = require("url");
var jsdom_1 = __importDefault(require("jsdom"));
var JSDOM = jsdom_1.default.JSDOM;
exports.symbol_internal = Symbol("_");
function join(table, predicate) {
    return [table, predicate];
}
exports.join = join;
function isTableColumn(value) {
    return (typeof value === "object" &&
        value !== null &&
        "name" in value &&
        "table" in value);
}
var HtmlDb = /** @class */ (function () {
    function HtmlDb(schema) {
        this.schema = schema;
    }
    HtmlDb.prototype.select = function (tableRef, predicates) {
        if (predicates === void 0) { predicates = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var tableStr, dom, table, filteredRows;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readTable(tableRef[exports.symbol_internal].name)];
                    case 1:
                        tableStr = _a.sent();
                        dom = new JSDOM(tableStr);
                        table = dom.window.document.querySelector("table");
                        filteredRows = Array.from(table.rows).filter(function (row) {
                            var _a;
                            return (_a = predicates.where) === null || _a === void 0 ? void 0 : _a.every(function (predicate) {
                                var a = _this.resolveValue(predicate.a, row);
                                var b = _this.resolveValue(predicate.b, row);
                                var conversionType = _this.getConversionType(predicate.a, predicate.b);
                                if (a === null || b === null) {
                                    if (predicate.operator === "=") {
                                        return a === b;
                                    }
                                    else if (predicate.operator === "!=") {
                                        return a !== b;
                                    }
                                    else {
                                        return false;
                                    }
                                }
                                var _a = [
                                    _this.typeCast(a.toString(), conversionType),
                                    _this.typeCast(b.toString(), conversionType),
                                ], a_norm = _a[0], b_norm = _a[1];
                                switch (predicate.operator) {
                                    case "=":
                                        return a_norm === b_norm;
                                    case "!=":
                                        return a_norm !== b_norm;
                                    case ">":
                                        return a_norm > b_norm;
                                    case "<":
                                        return a_norm < b_norm;
                                    case ">=":
                                        return a_norm >= b_norm;
                                    case "<=":
                                        return a_norm <= b_norm;
                                }
                            });
                        });
                        return [2 /*return*/, filteredRows
                                .slice(0, predicates.limit || Infinity)
                                .map(function (row) { return _this.rowToKv(row); })];
                }
            });
        });
    };
    HtmlDb.prototype.upsert = function (tableRef, rows, returnRows) {
        if (returnRows === void 0) { returnRows = false; }
        return __awaiter(this, void 0, void 0, function () {
            var tableStr, dom, table, maxId, res, _i, rows_1, item, existingRow, _a, _b, _c, key, value, newRow, _d, _e, _f, key, value;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, this.readTable(tableRef[exports.symbol_internal].name)];
                    case 1:
                        tableStr = _g.sent();
                        dom = new JSDOM(tableStr);
                        table = dom.window.document.querySelector("table");
                        maxId = parseInt(table.getAttribute("max") || "0");
                        res = [];
                        for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                            item = rows_1[_i];
                            if ("id" in item) {
                                existingRow = dom.window.document.getElementById(item.id);
                                if (existingRow) {
                                    for (_a = 0, _b = Object.entries(item); _a < _b.length; _a++) {
                                        _c = _b[_a], key = _c[0], value = _c[1];
                                        if (key === "id")
                                            continue;
                                        existingRow.setAttribute(key, value);
                                    }
                                    returnRows && res.push(this.rowToKv(existingRow));
                                    continue;
                                }
                            }
                            newRow = table.insertRow();
                            newRow.id = "id" in item ? item.id : (++maxId).toString();
                            maxId = Math.max(maxId, parseInt(newRow.id));
                            for (_d = 0, _e = Object.entries(item); _d < _e.length; _d++) {
                                _f = _e[_d], key = _f[0], value = _f[1];
                                if (key === "id")
                                    continue;
                                newRow.setAttribute(key, value);
                            }
                            returnRows && res.push(this.rowToKv(newRow));
                        }
                        table.setAttribute("max", maxId.toString());
                        return [4 /*yield*/, this.writeTable(tableRef[exports.symbol_internal].name, table)];
                    case 2:
                        _g.sent();
                        return [2 /*return*/, returnRows ? res : undefined];
                }
            });
        });
    };
    HtmlDb.prototype.getConversionType = function (predA, predB) {
        if (isTableColumn(predA)) {
            return predA.type;
        }
        else if (isTableColumn(predB)) {
            return predB.type;
        }
        else {
            return "string";
        }
    };
    HtmlDb.prototype.typeCast = function (value, type) {
        switch (type) {
            case "number":
                return Number(value);
            case "boolean":
                return Boolean(value);
            case "date":
                return new Date(value);
            default:
                return value;
        }
    };
    HtmlDb.prototype.resolveValue = function (value, row) {
        if (isTableColumn(value)) {
            return row.getAttribute(value.name);
        }
        return value;
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
