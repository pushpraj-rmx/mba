import type { Request, Response } from 'express';

export interface MessageEvent {
    id: string;
    from: string;
    timestamp: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contacts' | 'interactive';
    text?: {
        body: string;
    };
    image?: {
        id: string;
        mime_type: string;
        sha256: string;
    };
    document?: {
        id: string;
        mime_type: string;
        sha256: string;
        filename?: string;
    };
    context?: {
        from: string;
        id: string;
        referred_product?: {
            catalog_id: string;
            product_retailer_id: string;
        };
    };
}

export interface MessageWebhookData {
    messaging_product: 'whatsapp';
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts?: Array<{
        profile: {
            name: string;
        };
        wa_id: string;
    }>;
    messages?: MessageEvent[];
    statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        recipient_id: string;
        conversation?: {
            id: string;
            expiration_timestamp?: string;
            origin: {
                type: 'authentication' | 'marketing' | 'utility' | 'service' | 'referral_conversion';
            };
        };
        pricing?: {
            billable: boolean;
            pricing_model: 'CBP' | 'NBP';
            category: 'authentication' | 'marketing' | 'utility' | 'service' | 'referral_conversion';
        };
    }>;
}

export const handleMessageEvent = async (req: Request, res: Response) => {
    try {
        const webhookData: MessageWebhookData = req.body;

        console.log('📨 Processing message event:', {
            phoneNumberId: webhookData.metadata.phone_number_id,
            messageCount: webhookData.messages?.length || 0,
            statusCount: webhookData.statuses?.length || 0
        });

        // Handle incoming messages
        if (webhookData.messages) {
            for (const message of webhookData.messages) {
                await processIncomingMessage(message, webhookData.metadata);
            }
        }

        // Handle message status updates
        if (webhookData.statuses) {
            for (const status of webhookData.statuses) {
                await processMessageStatus(status, webhookData.metadata);
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error processing message event:', error);
        res.status(500).json({ error: 'Failed to process message event' });
    }
};

const processIncomingMessage = async (message: MessageEvent, metadata: MessageWebhookData['metadata']) => {
    console.log(`📩 New message from ${message.from}:`, {
        type: message.type,
        messageId: message.id,
        timestamp: message.timestamp
    });

    // Forward to chat service for processing
    try {
        const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:32103';
        const response = await fetch(`${chatServiceUrl}/api/chat/webhook/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'message',
                data: message,
                metadata
            })
        });

        if (response.ok) {
            console.log(`✅ Message forwarded to chat service successfully`);
        } else {
            console.error(`❌ Failed to forward message to chat service: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error forwarding message to chat service:', error);
    }

    // Log message details
    switch (message.type) {
        case 'text':
            console.log(`💬 Text message: "${message.text?.body}"`);
            break;
        case 'image':
            console.log(`🖼️ Image message received`);
            break;
        case 'document':
            console.log(`📄 Document message received`);
            break;
        case 'interactive':
            console.log(`🔘 Interactive message received`);
            break;
        default:
            console.log(`📦 ${message.type} message received`);
    }
};

const processMessageStatus = async (status: NonNullable<MessageWebhookData['statuses']>[0], metadata: MessageWebhookData['metadata']) => {
    console.log(`📊 Message status update:`, {
        messageId: status.id,
        status: status.status,
        recipientId: status.recipient_id,
        timestamp: status.timestamp
    });

    // Forward to chat service for processing
    try {
        const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:32103';
        const response = await fetch(`${chatServiceUrl}/api/chat/webhook/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'status',
                data: status,
                metadata
            })
        });

        if (response.ok) {
            console.log(`✅ Status update forwarded to chat service successfully`);
        } else {
            console.error(`❌ Failed to forward status update to chat service: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error forwarding status update to chat service:', error);
    }
};
