import axios, { AxiosInstance } from 'axios';
import { SendMessageRequest, SendMessageResponse, ChatServiceConfig } from './types';

export class WhatsAppAPI {
    private client: AxiosInstance;
    private config: ChatServiceConfig;

    constructor(config: ChatServiceConfig) {
        this.config = config;
        this.client = axios.create({
            baseURL: config.whatsappApiUrl,
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }

    async sendTextMessage(to: string, text: string, context?: { messageId: string }): Promise<SendMessageResponse> {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: { body: text },
                ...(context && { context: { message_id: context.messageId } })
            };

            console.log(`📤 Sending text message to ${to}:`, { text: text.substring(0, 50) + '...' });

            const response = await this.client.post(`/${this.config.phoneNumberId}/messages`, payload);

            const messageId = response.data.messages?.[0]?.id;
            if (!messageId) {
                throw new Error('No message ID returned from WhatsApp API');
            }

            console.log(`✅ Text message sent successfully: ${messageId}`);
            return { success: true, messageId };

        } catch (error: any) {
            console.error('❌ Failed to send text message:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    async sendTemplateMessage(
        to: string,
        templateName: string,
        language: string = 'en_US',
        components?: any[],
        context?: { messageId: string }
    ): Promise<SendMessageResponse> {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: language },
                    ...(components && { components })
                },
                ...(context && { context: { message_id: context.messageId } })
            };

            console.log(`📤 Sending template message to ${to}:`, { templateName, language });

            const response = await this.client.post(`/${this.config.phoneNumberId}/messages`, payload);

            const messageId = response.data.messages?.[0]?.id;
            if (!messageId) {
                throw new Error('No message ID returned from WhatsApp API');
            }

            console.log(`✅ Template message sent successfully: ${messageId}`);
            return { success: true, messageId };

        } catch (error: any) {
            console.error('❌ Failed to send template message:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    async sendMediaMessage(
        to: string,
        mediaType: 'image' | 'document' | 'audio' | 'video',
        mediaId: string,
        caption?: string,
        context?: { messageId: string }
    ): Promise<SendMessageResponse> {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to,
                type: mediaType,
                [mediaType]: {
                    id: mediaId,
                    ...(caption && { caption })
                },
                ...(context && { context: { message_id: context.messageId } })
            };

            console.log(`📤 Sending ${mediaType} message to ${to}:`, { mediaId });

            const response = await this.client.post(`/${this.config.phoneNumberId}/messages`, payload);

            const messageId = response.data.messages?.[0]?.id;
            if (!messageId) {
                throw new Error('No message ID returned from WhatsApp API');
            }

            console.log(`✅ ${mediaType} message sent successfully: ${messageId}`);
            return { success: true, messageId };

        } catch (error: any) {
            console.error(`❌ Failed to send ${mediaType} message:`, error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    async markMessageAsRead(messageId: string): Promise<boolean> {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            };

            await this.client.post(`/${this.config.phoneNumberId}/messages`, payload);
            console.log(`✅ Marked message ${messageId} as read`);
            return true;

        } catch (error: any) {
            console.error('❌ Failed to mark message as read:', error.response?.data || error.message);
            return false;
        }
    }

    async getMessageStatus(messageId: string): Promise<any> {
        try {
            const response = await this.client.get(`/${this.config.phoneNumberId}/messages/${messageId}`);
            return response.data;

        } catch (error: any) {
            console.error('❌ Failed to get message status:', error.response?.data || error.message);
            return null;
        }
    }

    async uploadMedia(file: Buffer, type: string): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append('file', new Blob([file]), 'media');
            formData.append('type', type);

            const response = await this.client.post(`/${this.config.phoneNumberId}/media`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const mediaId = response.data.id;
            console.log(`✅ Media uploaded successfully: ${mediaId}`);
            return mediaId;

        } catch (error: any) {
            console.error('❌ Failed to upload media:', error.response?.data || error.message);
            return null;
        }
    }
}
