import { v4 as uuidv4 } from 'uuid';
import { Message, Conversation } from './types';

// In-memory storage for development
// TODO: Replace with database (PostgreSQL, MongoDB, etc.)
class ChatStorage {
    private messages: Map<string, Message> = new Map();
    private conversations: Map<string, Conversation> = new Map();
    private messagesByConversation: Map<string, string[]> = new Map();

    // Message operations
    async saveMessage(message: Omit<Message, 'id'>): Promise<Message> {
        const id = uuidv4();
        const fullMessage: Message = {
            id,
            ...message,
            timestamp: message.timestamp || new Date().toISOString()
        };

        this.messages.set(id, fullMessage);

        // Update conversation message list
        const conversationMessages = this.messagesByConversation.get(message.conversationId) || [];
        conversationMessages.push(id);
        this.messagesByConversation.set(message.conversationId, conversationMessages);

        // Update conversation last message time
        await this.updateConversationLastMessage(message.conversationId, fullMessage.timestamp);

        console.log(`💾 Saved message ${id} to conversation ${message.conversationId}`);
        return fullMessage;
    }

    async getMessage(messageId: string): Promise<Message | null> {
        return this.messages.get(messageId) || null;
    }

    async getMessagesByConversation(conversationId: string, limit: number = 50): Promise<Message[]> {
        const messageIds = this.messagesByConversation.get(conversationId) || [];
        const messages = messageIds
            .slice(-limit) // Get last N messages
            .map(id => this.messages.get(id))
            .filter(Boolean) as Message[];

        return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    async updateMessageStatus(messageId: string, status: Message['status']): Promise<boolean> {
        const message = this.messages.get(messageId);
        if (message) {
            message.status = status;
            this.messages.set(messageId, message);
            console.log(`📊 Updated message ${messageId} status to ${status}`);
            return true;
        }
        return false;
    }

    // Conversation operations
    async saveConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation> {
        const id = uuidv4();
        const now = new Date().toISOString();
        const fullConversation: Conversation = {
            id,
            ...conversation,
            createdAt: now,
            updatedAt: now
        };

        this.conversations.set(id, fullConversation);
        console.log(`💾 Saved conversation ${id} with ${conversation.participantPhone}`);
        return fullConversation;
    }

    async getConversation(conversationId: string): Promise<Conversation | null> {
        return this.conversations.get(conversationId) || null;
    }

    async getConversationByParticipant(participantId: string): Promise<Conversation | null> {
        for (const conversation of this.conversations.values()) {
            if (conversation.participantId === participantId) {
                return conversation;
            }
        }
        return null;
    }

    async getActiveConversations(limit: number = 20): Promise<Conversation[]> {
        const conversations = Array.from(this.conversations.values())
            .filter(conv => conv.status === 'active')
            .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
            .slice(0, limit);

        return conversations;
    }

    async updateConversationLastMessage(conversationId: string, timestamp: string): Promise<void> {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.lastMessageAt = timestamp;
            conversation.messageCount = (this.messagesByConversation.get(conversationId) || []).length;
            conversation.updatedAt = new Date().toISOString();
            this.conversations.set(conversationId, conversation);
        }
    }

    async updateConversationStatus(conversationId: string, status: Conversation['status']): Promise<boolean> {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.status = status;
            conversation.updatedAt = new Date().toISOString();
            this.conversations.set(conversationId, conversation);
            console.log(`📊 Updated conversation ${conversationId} status to ${status}`);
            return true;
        }
        return false;
    }

    // Utility methods
    async getStats(): Promise<{ totalMessages: number; totalConversations: number; activeConversations: number }> {
        const totalMessages = this.messages.size;
        const totalConversations = this.conversations.size;
        const activeConversations = Array.from(this.conversations.values())
            .filter(conv => conv.status === 'active').length;

        return { totalMessages, totalConversations, activeConversations };
    }
}

export const chatStorage = new ChatStorage();
