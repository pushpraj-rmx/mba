"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const templates_1 = __importDefault(require("./routes/templates"));
const errorHandler_1 = require("./middleware/errorHandler");
function startServer(port) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mount routes
    app.use("/api", templates_1.default);
    // Error handler (last middleware)
    app.use(errorHandler_1.errorHandler);
    app.listen(port, () => {
        console.log(`🚀 Gateway running on http://localhost:${port}`);
    });
}
