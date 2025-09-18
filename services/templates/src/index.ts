import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Example: Meta credentials (server-side only)
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID!;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;

// Fetch templates from Meta API (if you want live)
async function fetchMetaTemplates() {
    const url = `https://graph.facebook.com/v23.0/1638023803544368/message_templates`;
    const res = await axios.get(url, {
        headers: {
            Authorization: `Bearer EAANy0uTZAlZAABPC4ruqkuzMcUVEiioWCl4yME4higebkKUOnd4VTyiZBacRpqNMvEkz4eSfABWRussWQq8RJ0rxVLuDxZBlucONoMasf4xTJnkSG54jlfqqZB0mpdm1lZBpJK5hHU1loFuw8IYSxw994xEjt3XxZBoaftWw3rjraVycYzNhci6IfW2zLKZBGQZDZD`,
        },
    });
    return res.data.data;
}

// GET /templates
app.get("/templates", async (req, res) => {
    try {
        console.log("📞 Templates service: GET /templates request received");
        // For now return mock
        const metaTemplates = await fetchMetaTemplates();
        console.log("✅ Templates service: Successfully fetched", metaTemplates.length, "templates");
        res.json(metaTemplates);
    } catch (err) {
        console.error("❌ Templates service error:", err);
        res.status(500).json({ error: "Failed to fetch templates", details: err instanceof Error ? err.message : String(err) });
    }
});

const PORT = 32102;
app.listen(PORT, () => console.log(`🚀 Templates service running on http://localhost:${PORT}`));
