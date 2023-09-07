"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbSchema = exports.car = exports.person = void 0;
var schema_1 = require("./lib/schema");
exports.person = (0, schema_1.createTable)({
    name: "person",
    key: "id",
    columns: {
        id: {
            type: "number",
        },
        name: {
            type: "string",
        },
        age: {
            type: "number",
        },
    },
});
exports.car = (0, schema_1.createTable)({
    name: "car",
    key: "id",
    columns: {
        id: {
            type: "number",
        },
        make: {
            type: "string",
        },
        model: {
            type: "string",
        },
        ownerId: {
            type: "number",
        },
    },
});
exports.dbSchema = {
    person: exports.person,
    car: exports.car,
};
