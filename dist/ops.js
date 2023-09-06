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
exports.upsert = exports.select = void 0;
var jsdom_1 = __importDefault(require("jsdom"));
var io_1 = require("./io");
var JSDOM = jsdom_1.default.JSDOM;
function rowToKv(row) {
    return Array.from(row.attributes).reduce(function (acc, _a) {
        var name = _a.name, value = _a.value;
        acc[name] = value;
        return acc;
    }, {});
}
function select(tableName, predicates) {
    if (predicates === void 0) { predicates = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var tableStr, dom, table, where, limit, limitSelector, equalityOps, whereSelector, rangeOps, rows, _loop_1, _i, rangeOps_1, op, query;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, io_1.readTable)(tableName)];
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
                                return "[".concat(key, "=\"").concat(value, "\"]");
                            if (operator === "!=")
                                return ":not([".concat(key, "=\"").concat(value, "\"])");
                        })
                            .join("")
                        : "";
                    rangeOps = (where === null || where === void 0 ? void 0 : where.filter(function (w) { return w.operator !== "=" && w.operator !== "!="; })) || [];
                    if (rangeOps.length > 0) {
                        rows = Array.from(table.querySelectorAll("tr"));
                        _loop_1 = function (op) {
                            var key = op.key, value = op.value, operator = op.operator;
                            rows = rows.filter(function (row) {
                                var rowVal = key === "id" ? row.id : row.getAttribute(key);
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
                        return [2 /*return*/, rows.map(function (row) { return rowToKv(row); })];
                    }
                    query = "table tr".concat(whereSelector).concat(limitSelector);
                    return [2 /*return*/, Array.from(table.querySelectorAll(query)).map(function (row) { return rowToKv(row); })];
            }
        });
    });
}
exports.select = select;
function upsert(tableName, values, returning) {
    if (returning === void 0) { returning = true; }
    return __awaiter(this, void 0, void 0, function () {
        var tableStr, dom, table, tBody, max, maxChanged, vals, returnVals, _i, vals_1, val, row, key, newRow, key, newRow, key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, io_1.readTable)(tableName)];
                case 1:
                    tableStr = _a.sent();
                    dom = new JSDOM(tableStr);
                    table = dom.window.document.querySelector("table");
                    tBody = table.tBodies[0];
                    max = parseInt(table.getAttribute("max") || "0");
                    maxChanged = false;
                    vals = Array.isArray(values) ? values : [values];
                    returnVals = [];
                    for (_i = 0, vals_1 = vals; _i < vals_1.length; _i++) {
                        val = vals_1[_i];
                        if ("id" in val) {
                            row = table.querySelector("tr[id=\"".concat(val.id, "\"]"));
                            if (row) {
                                // update
                                for (key in val) {
                                    if (key === "id")
                                        continue;
                                    row.setAttribute(key, val[key]);
                                }
                                if (returning)
                                    returnVals.push(rowToKv(row));
                            }
                            else {
                                newRow = dom.window.document.createElement("tr");
                                for (key in val) {
                                    if (key === "id") {
                                        newRow.setAttribute("id", val[key]);
                                        max = Math.max(max, parseInt(val[key]));
                                        maxChanged = true;
                                        continue;
                                    }
                                    newRow.setAttribute(key, val[key]);
                                }
                                tBody.appendChild(newRow);
                                if (returning)
                                    returnVals.push(rowToKv(newRow));
                            }
                        }
                        else {
                            newRow = dom.window.document.createElement("tr");
                            newRow.setAttribute("id", (max + 1).toString());
                            max++;
                            maxChanged = true;
                            for (key in val) {
                                newRow.setAttribute(key, val[key]);
                            }
                            tBody.appendChild(newRow);
                            if (returning)
                                returnVals.push(rowToKv(newRow));
                        }
                        if (maxChanged)
                            table.setAttribute("max", max.toString());
                        (0, io_1.writeTable)(tableName, dom.window.document.body.innerHTML);
                        if (returning)
                            return [2 /*return*/, returnVals];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.upsert = upsert;
