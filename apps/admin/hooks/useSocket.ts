'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:32103';

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Create socket connection
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('🔌 Connected to chat service via Socket.IO');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Disconnected from chat service');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            setConnected(false);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.close();
        };
    }, []);

    return { socket, connected };
}

export function useChatSocket() {
    const { socket, connected } = useSocket();
    const [conversations, setConversations] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;

        // Listen for new messages
        socket.on('new-message', (data) => {
            console.log('📨 New message received:', data);
            setMessages(prev => [...prev, data.message]);
        });

        // Listen for message status updates
        socket.on('message-status-updated', (data) => {
            console.log('📊 Message status updated:', data);
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId
                    ? { ...msg, status: data.status }
                    : msg
            ));
        });

        // Listen for conversation updates
        socket.on('conversation-updated', (conversation) => {
            console.log('💬 Conversation updated:', conversation);
            setConversations(prev => prev.map(conv =>
                conv.id === conversation.id ? conversation : conv
            ));
        });

        // Listen for sent messages
        socket.on('message-sent', (data) => {
            console.log('📤 Message sent:', data);
            // Refresh messages to get the latest
        });

        return () => {
            socket.off('new-message');
            socket.off('message-status-updated');
            socket.off('conversation-updated');
            socket.off('message-sent');
        };
    }, [socket]);

    const joinConversation = (conversationId: string) => {
        if (socket) {
            socket.emit('join-conversation', conversationId);
        }
    };

    const leaveConversation = (conversationId: string) => {
        if (socket) {
            socket.emit('leave-conversation', conversationId);
        }
    };

    return {
        socket,
        connected,
        conversations,
        messages,
        joinConversation,
        leaveConversation
    };
}
