"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const router = (0, express_1.Router)();
// Mount all templates requests
router.use("/templates", (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: "http://localhost:4200", // Templates service
    changeOrigin: true,
    pathRewrite: { "^/templates": "" }, // strip /templates for downstream service
}));
exports.default = router;
