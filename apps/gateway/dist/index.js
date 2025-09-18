"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
function startServer(port) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mount all routes under /api
    app.use("/api", routes_1.default);
    // Error handler last
    app.use(errorHandler_1.errorHandler);
    app.listen(port, () => {
        console.log(`🚀 Gateway running on http://localhost:${port}`);
    });
}
