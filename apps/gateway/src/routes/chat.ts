import { Router } from 'express';

const router = Router();

// Chat service URL
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:32103';

// Proxy chat endpoints to chat service
router.post('/send', async (req, res) => {
    try {
        const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        console.error('❌ Error proxying send message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

router.get('/conversations', async (req, res) => {
    try {
        const limit = req.query.limit || 20;
        const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/conversations?limit=${limit}`);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        console.error('❌ Error proxying get conversations:', error);
        res.status(500).json({ success: false, error: 'Failed to get conversations' });
    }
});

router.get('/conversations/:conversationId/messages', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit = req.query.limit || 50;
        const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/conversations/${conversationId}/messages?limit=${limit}`);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        console.error('❌ Error proxying get conversation messages:', error);
        res.status(500).json({ success: false, error: 'Failed to get conversation messages' });
    }
});

router.get('/conversations/participant/:participantId', async (req, res) => {
    try {
        const { participantId } = req.params;
        const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/conversations/participant/${participantId}`);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        console.error('❌ Error proxying get conversation by participant:', error);
        res.status(500).json({ success: false, error: 'Failed to get conversation' });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/stats`);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        console.error('❌ Error proxying get chat stats:', error);
        res.status(500).json({ success: false, error: 'Failed to get chat stats' });
    }
});

export default router;
