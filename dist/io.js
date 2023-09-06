"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTable = exports.readTable = void 0;
var path_1 = __importDefault(require("path"));
var url_1 = require("url");
var fs_1 = __importDefault(require("fs"));
function readTable(tableName) {
    return fs_1.default.promises.readFile((0, url_1.pathToFileURL)(path_1.default.join("tables", tableName + ".html")), "utf8");
}
exports.readTable = readTable;
function writeTable(tableName, table) {
    return fs_1.default.promises.writeFile((0, url_1.pathToFileURL)(path_1.default.join("tables", tableName + ".html")), table);
}
exports.writeTable = writeTable;