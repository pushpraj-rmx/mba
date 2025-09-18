import { createProxyMiddleware } from "http-proxy-middleware";

export function createProxy(target: string) {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: { "^/api": "" }, // remove /api prefix
    });
}
