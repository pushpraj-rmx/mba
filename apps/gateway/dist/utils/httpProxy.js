"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxy = createProxy;
const http_proxy_middleware_1 = require("http-proxy-middleware");
function createProxy(target) {
    return (0, http_proxy_middleware_1.createProxyMiddleware)({
        target,
        changeOrigin: true,
        pathRewrite: { "^/api": "" }, // remove /api prefix
    });
}
