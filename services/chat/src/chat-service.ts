import { WhatsAppAPI } from './whatsapp-api';
import { chatStorage } from './storage';
import { Message, Conversation, SendMessageRequest, SendMessageResponse, ChatServiceConfig } from './types';

export class ChatService {
    private whatsappAPI: WhatsAppAPI;
    private config: ChatServiceConfig;
    public io?: any; // Socket.IO instance

    constructor(config: ChatServiceConfig) {
        this.config = config;
        this.whatsappAPI = new WhatsAppAPI(config);
    }

    // Process incoming message from webhook
    async processIncomingMessage(
        messageData: any,
        metadata: { phoneNumberId: string; displayPhoneNumber: string }
    ): Promise<void> {
        try {
            const { from, id, type, timestamp, text, image, document, context } = messageData;

            // Get or create conversation
            let conversation = await chatStorage.getConversationByParticipant(from);
            if (!conversation) {
                conversation = await chatStorage.saveConversation({
                    participantId: from,
                    participantPhone: from,
                    status: 'active',
                    lastMessageAt: timestamp,
                    messageCount: 0,
                    metadata: {
                        phoneNumberId: metadata.phoneNumberId,
                        displayPhoneNumber: metadata.displayPhoneNumber
                    }
                });
            }

            // Determine message content based on type
            let content = '';
            let mediaUrl = '';
            let mediaId = '';

            switch (type) {
                case 'text':
                    content = text?.body || '';
                    break;
                case 'image':
                    content = '📷 Image message';
                    mediaId = image?.id || '';
                    break;
                case 'document':
                    content = '📄 Document message';
                    mediaId = document?.id || '';
                    break;
                case 'interactive':
                    content = '🔘 Interactive message';
                    break;
                default:
                    content = `📦 ${type} message`;
            }

            // Save incoming message
            const message = await chatStorage.saveMessage({
                conversationId: conversation.id,
                from,
                to: metadata.displayPhoneNumber,
                type,
                content,
                mediaUrl,
                mediaId,
                timestamp,
                status: 'delivered',
                direction: 'incoming',
                metadata: {
                    phoneNumberId: metadata.phoneNumberId,
                    displayPhoneNumber: metadata.displayPhoneNumber,
                    waId: from,
                    context
                }
            });

            console.log(`📩 Processed incoming message from ${from}:`, {
                messageId: message.id,
                conversationId: conversation.id,
                type,
                content: content.substring(0, 50) + '...'
            });

            // Emit socket event for real-time updates
            if (this.io) {
                this.io.to(`conversation-${conversation.id}`).emit('new-message', {
                    message,
                    conversation
                });
                this.io.emit('conversation-updated', conversation);
            }

            // TODO: Trigger automated responses, AI processing, etc.
            await this.handleIncomingMessage(message, conversation);

        } catch (error) {
            console.error('❌ Error processing incoming message:', error);
        }
    }

    // Process message status update from webhook
    async processMessageStatus(
        statusData: any,
        metadata: { phoneNumberId: string; displayPhoneNumber: string }
    ): Promise<void> {
        try {
            const { id, status, timestamp, recipient_id } = statusData;

            // Update message status in storage
            const updated = await chatStorage.updateMessageStatus(id, status);

            if (updated) {
                console.log(`📊 Updated message status:`, {
                    messageId: id,
                    status,
                    recipientId: recipient_id,
                    timestamp
                });

                // Emit socket event for status update
                if (this.io) {
                    this.io.emit('message-status-updated', {
                        messageId: id,
                        status,
                        recipientId: recipient_id,
                        timestamp
                    });
                }
            } else {
                console.log(`⚠️ Message not found for status update: ${id}`);
            }

        } catch (error) {
            console.error('❌ Error processing message status:', error);
        }
    }

    // Send outgoing message
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        try {
            // Get or create conversation
            let conversation = await chatStorage.getConversationByParticipant(request.to);
            if (!conversation) {
                conversation = await chatStorage.saveConversation({
                    participantId: request.to,
                    participantPhone: request.to,
                    status: 'active',
                    lastMessageAt: new Date().toISOString(),
                    messageCount: 0,
                    metadata: {
                        phoneNumberId: this.config.phoneNumberId,
                        displayPhoneNumber: this.config.phoneNumberId
                    }
                });
            }

            let result: SendMessageResponse;

            // Send message based on type
            if (request.type === 'text') {
                result = await this.whatsappAPI.sendTextMessage(
                    request.to,
                    request.content,
                    request.context
                );
            } else if (request.type === 'template') {
                result = await this.whatsappAPI.sendTemplateMessage(
                    request.to,
                    request.templateName!,
                    request.templateLanguage || 'en_US',
                    request.templateComponents,
                    request.context
                );
            } else {
                throw new Error(`Unsupported message type: ${request.type}`);
            }

            // Save outgoing message if successful
            if (result.success && result.messageId) {
                await chatStorage.saveMessage({
                    conversationId: conversation.id,
                    from: this.config.phoneNumberId,
                    to: request.to,
                    type: request.type,
                    content: request.content,
                    timestamp: new Date().toISOString(),
                    status: 'sent',
                    direction: 'outgoing',
                    metadata: {
                        phoneNumberId: this.config.phoneNumberId,
                        displayPhoneNumber: this.config.phoneNumberId
                    },
                    templateData: request.templateName ? {
                        name: request.templateName,
                        language: request.templateLanguage || 'en_US',
                        components: request.templateComponents
                    } : undefined
                });

                console.log(`📤 Sent message to ${request.to}:`, {
                    messageId: result.messageId,
                    type: request.type,
                    conversationId: conversation.id
                });

                // Emit socket event for sent message
                if (this.io) {
                    this.io.to(`conversation-${conversation.id}`).emit('message-sent', {
                        messageId: result.messageId,
                        conversation
                    });
                    this.io.emit('conversation-updated', conversation);
                }
            }

            return result;

        } catch (error: any) {
            console.error('❌ Error sending message:', error);
            return { success: false, error: error.message };
        }
    }

    // Get conversation messages
    async getConversationMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
        return await chatStorage.getMessagesByConversation(conversationId, limit);
    }

    // Get active conversations
    async getActiveConversations(limit: number = 20): Promise<Conversation[]> {
        return await chatStorage.getActiveConversations(limit);
    }

    // Get conversation by participant
    async getConversationByParticipant(participantId: string): Promise<Conversation | null> {
        return await chatStorage.getConversationByParticipant(participantId);
    }

    // Get chat statistics
    async getStats(): Promise<{ totalMessages: number; totalConversations: number; activeConversations: number }> {
        return await chatStorage.getStats();
    }

    // Handle incoming message (placeholder for business logic)
    private async handleIncomingMessage(message: Message, conversation: Conversation): Promise<void> {
        // TODO: Implement business logic
        // - Auto-reply rules
        // - AI processing
        // - Integration with other services
        // - Notification triggers

        console.log(`🤖 Processing incoming message logic for conversation ${conversation.id}`);

        // Example: Auto-reply to text messages
        if (message.type === 'text' && message.direction === 'incoming') {
            const lowerContent = message.content.toLowerCase();

            if (lowerContent.includes('hello') || lowerContent.includes('hi')) {
                await this.sendMessage({
                    to: message.from,
                    type: 'text',
                    content: 'Hello! How can I help you today?',
                    context: { messageId: message.id }
                });
            }
        }
    }
}
