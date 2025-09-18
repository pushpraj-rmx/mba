import express from "express";
import routes from "./routes/templates";
import { errorHandler } from "./middleware/errorHandler";

export function startServer(port: number | string) {
    const app = express();

    app.use(express.json());

    // Mount routes
    app.use("/api", routes);

    // Error handler (last middleware)
    app.use(errorHandler);

    app.listen(port, () => {
        console.log(`🚀 Gateway running on http://localhost:${port}`);
    });
}
