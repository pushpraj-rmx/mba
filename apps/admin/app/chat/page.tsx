'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, MessageSquare, Users, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useChatSocket } from '@/hooks/useSocket';

interface Conversation {
    id: string;
    participantId: string;
    participantPhone: string;
    status: 'active' | 'paused' | 'closed';
    lastMessageAt: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
}

interface Message {
    id: string;
    conversationId: string;
    from: string;
    to: string;
    type: string;
    content: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    direction: 'incoming' | 'outgoing';
}

interface ChatStats {
    totalMessages: number;
    totalConversations: number;
    activeConversations: number;
}

const GATEWAY_URL = 'http://localhost:32101';

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [stats, setStats] = useState<ChatStats | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Socket.io integration
    const { socket, connected, joinConversation, leaveConversation } = useChatSocket();

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const response = await fetch(`${GATEWAY_URL}/api/chat/conversations`);
            const data = await response.json();
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Fetch messages for selected conversation
    const fetchMessages = async (conversationId: string) => {
        try {
            const response = await fetch(`${GATEWAY_URL}/api/chat/conversations/${conversationId}/messages`);
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Fetch chat statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`${GATEWAY_URL}/api/chat/stats`);
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Send message
    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return;

        setSending(true);
        try {
            const response = await fetch(`${GATEWAY_URL}/api/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: selectedConversation.participantPhone,
                    type: 'text',
                    content: newMessage.trim(),
                }),
            });

            const data = await response.json();
            if (data.success) {
                setNewMessage('');
                // Refresh messages
                await fetchMessages(selectedConversation.id);
                // Refresh conversations to update last message time
                await fetchConversations();
            } else {
                console.error('Failed to send message:', data.error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    // Handle conversation selection
    const handleConversationSelect = (conversation: Conversation) => {
        // Leave previous conversation room
        if (selectedConversation) {
            leaveConversation(selectedConversation.id);
        }

        setSelectedConversation(conversation);
        fetchMessages(conversation.id);

        // Join new conversation room
        joinConversation(conversation.id);
    };

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    // Format phone number
    const formatPhoneNumber = (phone: string) => {
        return phone.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchConversations(),
                fetchStats(),
            ]);
            setLoading(false);
        };
        loadData();
    }, []);

    // Socket.io event handlers
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (data: any) => {
            console.log('📨 New message via socket:', data);

            // Update conversations list
            setConversations(prev => prev.map(conv =>
                conv.id === data.conversation.id ? data.conversation : conv
            ));

            // If this is the currently selected conversation, refresh messages
            if (selectedConversation && data.conversation.id === selectedConversation.id) {
                console.log('🔄 Refreshing messages for current conversation');
                await fetchMessages(selectedConversation.id);
            }
        };

        const handleMessageStatusUpdate = (data: any) => {
            console.log('📊 Message status update via socket:', data);
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId
                    ? { ...msg, status: data.status }
                    : msg
            ));
        };

        const handleConversationUpdate = async (conversation: Conversation) => {
            console.log('💬 Conversation update via socket:', conversation);
            setConversations(prev => prev.map(conv =>
                conv.id === conversation.id ? conversation : conv
            ));

            // If this is the currently selected conversation, refresh messages
            if (selectedConversation && conversation.id === selectedConversation.id) {
                console.log('🔄 Refreshing messages due to conversation update');
                await fetchMessages(selectedConversation.id);
            }
        };

        socket.on('new-message', handleNewMessage);
        socket.on('message-status-updated', handleMessageStatusUpdate);
        socket.on('conversation-updated', handleConversationUpdate);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('message-status-updated', handleMessageStatusUpdate);
            socket.off('conversation-updated', handleConversationUpdate);
        };
    }, [socket, selectedConversation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (selectedConversation) {
                leaveConversation(selectedConversation.id);
            }
        };
    }, [selectedConversation, leaveConversation]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading chat data...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    <h1 className="text-3xl font-bold">WhatsApp Chat</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            await fetchConversations();
                            if (selectedConversation) {
                                await fetchMessages(selectedConversation.id);
                            }
                            await fetchStats();
                        }}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh Now
                    </Button>
                    <div className="flex items-center gap-2 text-sm">
                        {connected ? (
                            <>
                                <Wifi className="h-4 w-4 text-green-500" />
                                <span className="text-green-600">Real-time connected</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-4 w-4 text-red-500" />
                                <span className="text-red-600">Disconnected</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalConversations}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeConversations}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalMessages}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-96 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    No conversations found
                                </div>
                            ) : (
                                conversations.map((conversation) => (
                                    <div
                                        key={conversation.id}
                                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                                            }`}
                                        onClick={() => handleConversationSelect(conversation)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">
                                                    {formatPhoneNumber(conversation.participantPhone)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {conversation.messageCount} messages
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                                                    {conversation.status}
                                                </Badge>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {formatTimestamp(conversation.lastMessageAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Messages View */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>
                            {selectedConversation ? (
                                `Messages with ${formatPhoneNumber(selectedConversation.participantPhone)}`
                            ) : (
                                'Select a conversation to view messages'
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col h-96">
                        {selectedConversation ? (
                            <>
                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">
                                            No messages in this conversation
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.direction === 'outgoing'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                        }`}
                                                >
                                                    <div className="text-sm">{message.content}</div>
                                                    <div
                                                        className={`text-xs mt-1 ${message.direction === 'outgoing'
                                                            ? 'text-primary-foreground/70'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        {formatTimestamp(message.timestamp)}
                                                        {message.direction === 'outgoing' && (
                                                            <span className="ml-2">
                                                                {message.status === 'sent' && '✓'}
                                                                {message.status === 'delivered' && '✓✓'}
                                                                {message.status === 'read' && '✓✓ (blue)'}
                                                                {message.status === 'failed' && '✗'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <Separator />

                                {/* Send Message */}
                                <div className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        disabled={sending}
                                    />
                                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                Select a conversation from the list to start chatting
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
