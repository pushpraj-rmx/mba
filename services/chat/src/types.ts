// Chat service types
export interface Message {
    id: string;
    conversationId: string;
    from: string;
    to: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contacts' | 'interactive' | 'template';
    content: string;
    mediaUrl?: string;
    mediaId?: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    direction: 'incoming' | 'outgoing';
    metadata?: {
        phoneNumberId: string;
        displayPhoneNumber: string;
        waId?: string;
        context?: {
            from: string;
            id: string;
        };
    };
    templateData?: {
        name: string;
        language: string;
        components?: any[];
    };
}

export interface Conversation {
    id: string;
    participantId: string;
    participantName?: string;
    participantPhone: string;
    status: 'active' | 'paused' | 'closed';
    lastMessageAt: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    metadata?: {
        phoneNumberId: string;
        displayPhoneNumber: string;
        origin?: 'utility' | 'marketing' | 'authentication' | 'service' | 'referral_conversion';
    };
}

export interface SendMessageRequest {
    to: string;
    type: 'text' | 'template';
    content: string;
    templateName?: string;
    templateLanguage?: string;
    templateComponents?: any[];
    context?: {
        messageId: string;
    };
}

export interface SendMessageResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface ChatServiceConfig {
    whatsappApiUrl: string;
    accessToken: string;
    phoneNumberId: string;
    webhookVerifyToken: string;
    port: number;
}
