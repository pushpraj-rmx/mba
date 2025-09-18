import { Router, type Request, type Response } from 'express';
import { handleMessageEvent } from './handlers/message';
import { handleStatusEvent } from './handlers/status';
import { handleTemplateEvent } from './handlers/template';

const router = Router();

// Set verify_token from environment
const verifyToken: string = process.env.VERIFY_TOKEN || 'default_token';

// Interface for webhook verification query parameters 
interface WebhookVerificationQuery {
    'hub.mode'?: string;
    'hub.challenge'?: string;
    'hub.verify_token'?: string;
}

// Route for GET requests (webhook verification) 
router.get('/', (req: Request<{}, {}, {}, WebhookVerificationQuery>, res: Response) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Meta Webhook VERIFIED');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Meta Webhook verification failed');
        res.status(403).end();
    }
});

// Route for POST requests (webhook events) 
router.post('/', async (req: Request, res: Response) => {
    const timestamp: string = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(`\n📨 Meta Webhook received ${timestamp}`);

    try {
        const webhookData = req.body;

        // Meta webhook structure: { object, entry: [{ changes: [{ value: {...} }] }] }
        if (webhookData.entry && webhookData.entry.length > 0) {
            const entry = webhookData.entry[0];
            if (entry.changes && entry.changes.length > 0) {
                const change = entry.changes[0];
                const value = change.value;

                // Check if it's a message/status event
                if (value.messages || value.statuses) {
                    // Transform to expected format and handle
                    const transformedData = {
                        messaging_product: value.messaging_product,
                        metadata: value.metadata,
                        messages: value.messages,
                        statuses: value.statuses
                    };

                    // Temporarily replace the body and call handler
                    const originalBody = req.body;
                    req.body = transformedData;
                    await handleMessageEvent(req, res);
                    req.body = originalBody; // Restore original body
                    return;
                }

                // Check if it's a template event
                if (change.field === 'message_templates' || value.event === 'template_status_update') {
                    const transformedData = {
                        messaging_product: value.messaging_product,
                        metadata: value.metadata,
                        event: 'template_status_update',
                        template: value.template
                    };

                    // Temporarily replace the body and call handler
                    const originalBody = req.body;
                    req.body = transformedData;
                    await handleTemplateEvent(req, res);
                    req.body = originalBody; // Restore original body
                    return;
                }
            }
        }

        // Unknown event type - log and respond with 200
        console.log('❓ Unknown webhook event type:', JSON.stringify(webhookData, null, 2));
        res.status(200).json({ success: true, message: 'Event logged but not processed' });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

