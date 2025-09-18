import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ChatService } from './chat-service';
import { ChatServiceConfig } from './types';
import { chatStorage } from './storage';

// Configuration
const config: ChatServiceConfig = {
    whatsappApiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v23.0',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAAET1x7TtHYBPV5ApEGG8aU2aY0fWhFPUthmzxxdeuZB9ILeE7h2ZBNDZBO9AZBPq17Iu4dZBZBMZAZBMQSVNpJs3IQSeNdA04SB8i5660nyX1Gf7Fo0wDfd9V7H9HOHWu7JCgewoIzYZCscDpADeEYWC1U4Kmyf1XhInPoW82jzZAJNTK7ckkUM6t0lOj1KlGzr0LogZDZD',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '767516993111781',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'default_token',
    port: parseInt(process.env.PORT || '32103')
};

// Initialize chat service
const chatService = new ChatService(config);

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:32100',
            'http://localhost:32101',
            'https://admin.nmpinfotech.com'
        ],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:32101',
        'https://admin.nmpinfotech.com'
    ],
    credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'chat',
        timestamp: new Date().toISOString()
    });
});

// Chat API endpoints
app.post('/api/chat/send', async (req, res) => {
    try {
        const { to, type, content, templateName, templateLanguage, templateComponents, context } = req.body;

        if (!to || !type || !content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, type, content'
            });
        }

        const result = await chatService.sendMessage({
            to,
            type,
            content,
            templateName,
            templateLanguage,
            templateComponents,
            context
        });

        res.json(result);
    } catch (error: any) {
        console.error('❌ Error in send message endpoint:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get conversation messages
app.get('/api/chat/conversations/:conversationId/messages', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const messages = await chatService.getConversationMessages(conversationId, limit);
        res.json({ success: true, messages });
    } catch (error: any) {
        console.error('❌ Error getting conversation messages:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get active conversations
app.get('/api/chat/conversations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const conversations = await chatService.getActiveConversations(limit);
        res.json({ success: true, conversations });
    } catch (error: any) {
        console.error('❌ Error getting conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get conversation by participant
app.get('/api/chat/conversations/participant/:participantId', async (req, res) => {
    try {
        const { participantId } = req.params;
        const conversation = await chatService.getConversationByParticipant(participantId);

        if (!conversation) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        res.json({ success: true, conversation });
    } catch (error: any) {
        console.error('❌ Error getting conversation by participant:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get chat statistics
app.get('/api/chat/stats', async (req, res) => {
    try {
        const stats = await chatService.getStats();
        res.json({ success: true, stats });
    } catch (error: any) {
        console.error('❌ Error getting chat stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Webhook endpoint for processing messages (called by gateway)
app.post('/api/chat/webhook/process', async (req, res) => {
    try {
        const { type, data, metadata } = req.body;

        if (type === 'message') {
            await chatService.processIncomingMessage(data, metadata);
        } else if (type === 'status') {
            await chatService.processMessageStatus(data, metadata);
        } else {
            return res.status(400).json({ success: false, error: 'Invalid webhook type' });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join conversation room
    socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation-${conversationId}`);
        console.log(`👥 Client ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation-${conversationId}`);
        console.log(`👋 Client ${socket.id} left conversation ${conversationId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Make io available to chat service
(chatService as any).io = io;

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
server.listen(config.port, () => {
    console.log(`🚀 Chat service running on http://localhost:${config.port}`);
    console.log(`📡 Chat API available at http://localhost:${config.port}/api/chat/`);
    console.log(`🔌 Socket.IO server running on http://localhost:${config.port}`);
    console.log(`🔧 WhatsApp API URL: ${config.whatsappApiUrl}`);
    console.log(`📱 Phone Number ID: ${config.phoneNumberId}`);
});

export { chatService };
