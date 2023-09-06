"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTable = exports.readTable = exports.fileUrlFromTableName = void 0;
var path_1 = __importDefault(require("path"));
var url_1 = require("url");
var fs_1 = __importDefault(require("fs"));
function fileUrlFromTableName(tableName) {
    return (0, url_1.pathToFileURL)(path_1.default.join("tables", tableName + ".html"));
}
exports.fileUrlFromTableName = fileUrlFromTableName;
function readTable(tableName) {
    return fs_1.default.promises.readFile(fileUrlFromTableName(tableName), "utf8");
}
exports.readTable = readTable;
function writeTable(tableName, table) {
    return fs_1.default.promises.writeFile(fileUrlFromTableName(tableName), table);
}
exports.writeTable = writeTable;
