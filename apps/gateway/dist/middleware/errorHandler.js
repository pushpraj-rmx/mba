"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error("❌ Gateway Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
}
