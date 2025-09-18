import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import webhookRouter from "./webhooks";

export function startServer(port: number | string) {
    const app = express();

    // Enable CORS for all routes
    app.use(cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://admin.nmpinfotech.com",
            "http://localhost:32100",
            "http://localhost:32101",
            "http://localhost:32102"

        ], // Add your admin app ports
        credentials: true,
    }));

    app.use(express.json());

    // Mount all routes under /api
    app.use("/api", routes);

    // Mount webhook routes
    app.use("/webhooks", webhookRouter);


    // Error handler last
    app.use(errorHandler);

    app.listen(port, () => {
        console.log(`🚀 Gateway running on http://localhost:${port}`);
        console.log(`📡 Webhooks available at http://localhost:${port}/webhooks/`);
    });
}

// Start the server
const PORT = process.env.PORT || 32101;
startServer(PORT);
