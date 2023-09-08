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
function isTableColumn(value) {
    return (typeof value === "object" &&
        value !== null &&
        "name" in value &&
        "table" in value);
}
function isValidPrimitive(value) {
    return (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value instanceof Date ||
        value === null);
}
var HtmlDb = /** @class */ (function () {
    function HtmlDb(schema) {
        var _this = this;
        this.schema = schema;
        var _loop_1 = function (tableName) {
            this_1.readTable(tableName).catch(function () {
                console.log("Table ".concat(tableName, " not found, creating..."));
                _this.createTable(tableName);
            });
        };
        var this_1 = this;
        for (var _i = 0, _a = Object.entries(this.schema); _i < _a.length; _i++) {
            var tableName = _a[_i][0];
            _loop_1(tableName);
        }
    }
    HtmlDb.prototype.select = function (tableRef, predicates) {
        if (predicates === void 0) { predicates = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var tableStr, dom, table, filteredRows, res, _res, extraTables, _loop_2, this_2, _i, _a, _b, tbl, preds, alias;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.readTable(tableRef[exports.symbol_internal].name)];
                    case 1:
                        tableStr = _c.sent();
                        dom = new JSDOM(tableStr);
                        table = dom.window.document.querySelector("table");
                        filteredRows = Array.from(table.rows).filter(function (row) {
                            var _a;
                            return (((_a = predicates.where) === null || _a === void 0 ? void 0 : _a.every(function (predicate) {
                                var a = _this.resolveValue(predicate.a, row);
                                var b = _this.resolveValue(predicate.b, row);
                                var conversionType = _this.getConversionType(predicate.a, predicate.b);
                                var _a = [
                                    _this.typeCast(a, conversionType),
                                    _this.typeCast(b, conversionType),
                                ], a_norm = _a[0], b_norm = _a[1];
                                if (a_norm === null || b_norm === null) {
                                    if (predicate.operator === "=") {
                                        return a_norm === b_norm;
                                    }
                                    else if (predicate.operator === "!=") {
                                        return a_norm !== b_norm;
                                    }
                                    else {
                                        return false;
                                    }
                                }
                                if (Array.isArray(a_norm))
                                    throw new Error("Cannot provide array as lhs");
                                if (predicate.operator === "in") {
                                    if (!Array.isArray(b_norm)) {
                                        throw new Error("Must provide an array with 'in' operator");
                                    }
                                    else if (Array.isArray(a_norm)) {
                                        throw new Error("'in' operator rhs must be array of primitives");
                                    }
                                    return b_norm.includes(a_norm);
                                }
                                if (Array.isArray(a_norm) || Array.isArray(b_norm)) {
                                    throw new Error("Must provide array with 'in' operator");
                                }
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
                            })) || !predicates.where);
                        });
                        res = filteredRows
                            .slice(0, predicates.limit || Infinity)
                            .map(function (row) { return _this.rowToKv(row); });
                        if (!predicates.with) return [3 /*break*/, 3];
                        _res = res;
                        return [4 /*yield*/, Promise.all(predicates.with.map(function (_a) {
                                var table = _a[0];
                                return __awaiter(_this, void 0, void 0, function () {
                                    var tblData;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.readTable(table[exports.symbol_internal].name)];
                                            case 1:
                                                tblData = _b.sent();
                                                return [2 /*return*/, {
                                                        name: table[exports.symbol_internal].name,
                                                        data: tblData,
                                                    }];
                                        }
                                    });
                                });
                            }))];
                    case 2:
                        extraTables = _c.sent();
                        _loop_2 = function (tbl, preds, alias) {
                            var _alias = (alias !== null && alias !== void 0 ? alias : tbl[exports.symbol_internal].name);
                            var _d = extraTables.shift(), name_1 = _d.name, data = _d.data;
                            var dom_1 = new JSDOM(data);
                            var table_1 = dom_1.window.document.querySelector("table");
                            var rows = Array.from(table_1.querySelectorAll("tr"));
                            var _loop_3 = function (pred) {
                                var ctxColumn = void 0;
                                var localColumn;
                                if (!isTableColumn(pred.a) && !isTableColumn(pred.b)) {
                                    throw new Error("Must provide at least one table column");
                                }
                                if (isTableColumn(pred.a)) {
                                    if (pred.a.table === tableRef[exports.symbol_internal].name) {
                                        ctxColumn = pred.a;
                                    }
                                    else if (pred.a.table === name_1) {
                                        localColumn = pred.a;
                                    }
                                }
                                if (isTableColumn(pred.b)) {
                                    if (pred.b.table === tableRef[exports.symbol_internal].name) {
                                        ctxColumn = pred.b;
                                    }
                                    else if (pred.b.table === name_1) {
                                        localColumn = pred.b;
                                    }
                                }
                                if (!localColumn) {
                                    throw new Error("Unable to determine local table column for 'with' predicate");
                                }
                                var _loop_4 = function (row) {
                                    var localVal = localColumn.name === "id"
                                        ? row.id
                                        : this_2.resolveValue(localColumn, row);
                                    if (localVal === null)
                                        return "continue";
                                    if (ctxColumn) {
                                        var colName_1 = ctxColumn.name;
                                        // find matching rows in ctx table, assign to _res[_alias]
                                        _res.forEach(function (r) {
                                            if (_this.typeCast(r[colName_1], localColumn.type) !=
                                                localVal)
                                                return;
                                            if (typeof r[_alias] === "string")
                                                throw new Error("subquery selection alias conflicts with existing column");
                                            if (!Array.isArray(r[_alias]))
                                                r[_alias] = [];
                                            r[_alias].push(_this.rowToKv(row));
                                        });
                                    }
                                    else {
                                        // no ctx column, evaluate predicate against rows
                                        var _g = [
                                            this_2.resolveValue(pred.a, row),
                                            this_2.resolveValue(pred.b, row),
                                        ], a = _g[0], b = _g[1];
                                        var conversionType = this_2.getConversionType(pred.a, pred.b);
                                        var _h = [
                                            this_2.typeCast(a, conversionType),
                                            this_2.typeCast(b, conversionType),
                                        ], a_norm = _h[0], b_norm = _h[1];
                                        if (Array.isArray(a_norm) || Array.isArray(b_norm)) {
                                            throw new Error("Must provide array with 'in' operator");
                                        }
                                        if (a_norm === null || b_norm === null) {
                                            throw new Error("Unable to evaluate predicate with null value");
                                        }
                                        switch (pred.operator) {
                                            case "=":
                                                if (a_norm === b_norm) {
                                                    _res.forEach(function (r) {
                                                        if (typeof r[_alias] === "string")
                                                            throw new Error("subquery selection alias conflicts with existing column");
                                                        if (!Array.isArray(r[_alias]))
                                                            r[_alias] = [];
                                                        r[_alias].push(_this.rowToKv(row));
                                                    });
                                                }
                                                break;
                                            case "!=":
                                                if (a_norm !== b_norm) {
                                                    _res.forEach(function (r) {
                                                        if (typeof r[_alias] === "string")
                                                            throw new Error("subquery selection alias conflicts with existing column");
                                                        if (!Array.isArray(r[_alias]))
                                                            r[_alias] = [];
                                                        r[_alias].push(_this.rowToKv(row));
                                                    });
                                                }
                                                break;
                                            case ">":
                                                if (a_norm > b_norm) {
                                                    console.log(">", a_norm, b_norm);
                                                    _res.forEach(function (r) {
                                                        if (typeof r[_alias] === "string")
                                                            throw new Error("subquery selection alias conflicts with existing column");
                                                        if (!Array.isArray(r[_alias]))
                                                            r[_alias] = [];
                                                        r[_alias].push(_this.rowToKv(row));
                                                    });
                                                }
                                                break;
                                            case "<":
                                                if (a_norm < b_norm) {
                                                    _res.forEach(function (r) {
                                                        if (typeof r[_alias] === "string")
                                                            throw new Error("subquery selection alias conflicts with existing column");
                                                        if (!Array.isArray(r[_alias]))
                                                            r[_alias] = [];
                                                        r[_alias].push(_this.rowToKv(row));
                                                    });
                                                }
                                                break;
                                            case ">=":
                                                if (a_norm >= b_norm) {
                                                    _res.forEach(function (r) {
                                                        if (typeof r[_alias] === "string")
                                                            throw new Error("subquery selection alias conflicts with existing column");
                                                        if (!Array.isArray(r[_alias]))
                                                            r[_alias] = [];
                                                        r[_alias].push(_this.rowToKv(row));
                                                    });
                                                }
                                                break;
                                            case "<=":
                                                if (a_norm <= b_norm) {
                                                    _res.forEach(function (r) {
                                                        if (typeof r[_alias] === "string")
                                                            throw new Error("subquery selection alias conflicts with existing column");
                                                        if (!Array.isArray(r[_alias]))
                                                            r[_alias] = [];
                                                        r[_alias].push(_this.rowToKv(row));
                                                    });
                                                }
                                                break;
                                        }
                                    }
                                };
                                for (var _f = 0, rows_1 = rows; _f < rows_1.length; _f++) {
                                    var row = rows_1[_f];
                                    _loop_4(row);
                                }
                            };
                            for (var _e = 0, preds_1 = preds; _e < preds_1.length; _e++) {
                                var pred = preds_1[_e];
                                _loop_3(pred);
                            }
                        };
                        this_2 = this;
                        for (_i = 0, _a = predicates.with; _i < _a.length; _i++) {
                            _b = _a[_i], tbl = _b[0], preds = _b[1], alias = _b[2];
                            _loop_2(tbl, preds, alias);
                        }
                        _c.label = 3;
                    case 3: return [2 /*return*/, res];
                }
            });
        });
    };
    HtmlDb.prototype.upsert = function (tableRef, rows, returnRows) {
        if (returnRows === void 0) { returnRows = false; }
        return __awaiter(this, void 0, void 0, function () {
            var tableStr, dom, table, maxId, res, _i, rows_2, item, existingRow, _a, _b, _c, key, value, newRow, _d, _e, _f, key, value;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, this.readTable(tableRef[exports.symbol_internal].name)];
                    case 1:
                        tableStr = _g.sent();
                        dom = new JSDOM(tableStr);
                        table = dom.window.document.querySelector("table");
                        maxId = parseInt(table.getAttribute("max") || "0");
                        res = [];
                        for (_i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
                            item = rows_2[_i];
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
            if (isTableColumn(predA))
                return predA.type;
            if (isTableColumn(predB))
                return predB.type;
            if (isValidPrimitive(predA))
                return typeof predA;
            if (isValidPrimitive(predB))
                return typeof predB;
            throw new Error("Unable to determine conversion type");
        }
    };
    HtmlDb.prototype.typeCast = function (value, type) {
        if (value === null)
            return null;
        if (Array.isArray(value)) {
            return value.map(function (v) {
                if (v === null)
                    return null;
                switch (type) {
                    case "number":
                        return Number(v);
                    case "boolean":
                        return Boolean(v);
                    case "date":
                        return new Date(v.toString());
                    case "datetime":
                        return new Date(v.toString());
                    default:
                        return v;
                }
            });
        }
        switch (type) {
            case "number":
                return Number(value);
            case "boolean":
                return Boolean(value);
            case "date":
                return new Date(value.toString());
            case "datetime":
                return new Date(value.toString());
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
    HtmlDb.prototype.createTable = function (tableName) {
        return __awaiter(this, void 0, void 0, function () {
            var table;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = new JSDOM().window.document.createElement("table");
                        table.setAttribute("max", "0");
                        return [4 /*yield*/, this.writeTable(tableName, table)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return HtmlDb;
}());
exports.HtmlDb = HtmlDb;
