import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = Router();

// Proxy /templates/* to Templates service
router.use(
    "/templates",
    createProxyMiddleware({
        target: "http://localhost:32102",
        changeOrigin: true,
        pathRewrite: { "^/templates": "" },
    })
);

// Proxy /whatsapp/templates to Templates service (for admin app)
router.get("/whatsapp/templates", createProxyMiddleware({
    target: "http://localhost:32102",
    changeOrigin: true,
    pathRewrite: { "^/whatsapp/templates": "/templates" },
}));


export default router;
