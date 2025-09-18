import type { Request, Response } from 'express';

export interface StatusEvent {
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
    errors?: Array<{
        code: number;
        title: string;
        message: string;
        error_data?: {
            details: string;
        };
    }>;
}

export interface StatusWebhookData {
    messaging_product: 'whatsapp';
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    statuses: StatusEvent[];
}

export const handleStatusEvent = async (req: Request, res: Response) => {
    try {
        const webhookData: StatusWebhookData = req.body;

        console.log('📊 Processing status event:', {
            phoneNumberId: webhookData.metadata.phone_number_id,
            statusCount: webhookData.statuses.length
        });

        for (const status of webhookData.statuses) {
            await processStatusUpdate(status, webhookData.metadata);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error processing status event:', error);
        res.status(500).json({ error: 'Failed to process status event' });
    }
};

const processStatusUpdate = async (status: StatusEvent, metadata: StatusWebhookData['metadata']) => {
    const statusEmoji = getStatusEmoji(status.status);

    console.log(`${statusEmoji} Status update:`, {
        messageId: status.id,
        status: status.status,
        recipientId: status.recipient_id,
        timestamp: status.timestamp,
        conversationId: status.conversation?.id,
        billable: status.pricing?.billable
    });

    // Handle failed messages
    if (status.status === 'failed' && status.errors) {
        console.error('❌ Message failed:', status.errors);
        await handleFailedMessage(status);
    }

    // TODO: Implement status update logic
    // - Update message status in database
    // - Update conversation analytics
    // - Trigger notifications for important status changes
    // - Handle billing updates
    // - Update delivery metrics
};

const getStatusEmoji = (status: StatusEvent['status']): string => {
    switch (status) {
        case 'sent': return '📤';
        case 'delivered': return '✅';
        case 'read': return '👁️';
        case 'failed': return '❌';
        default: return '📊';
    }
};

const handleFailedMessage = async (status: StatusEvent) => {
    console.log('🚨 Handling failed message:', {
        messageId: status.id,
        errors: status.errors?.map(e => ({ code: e.code, message: e.message }))
    });

    // TODO: Implement failed message handling
    // - Log error details
    // - Update retry logic
    // - Notify administrators
    // - Update user communication preferences
};
