# Chat Service

A comprehensive WhatsApp chat service that handles both incoming and outgoing messages.

## Features

- ✅ **Incoming Message Processing**: Handles webhook events from WhatsApp
- ✅ **Outgoing Message Sending**: Send text and template messages
- ✅ **Conversation Management**: Track conversations and message history
- ✅ **Message Storage**: In-memory storage (easily replaceable with database)
- ✅ **Status Tracking**: Monitor message delivery status
- ✅ **Auto-reply**: Basic auto-reply functionality

## Architecture

```
WhatsApp Webhook → Gateway → Chat Service → WhatsApp API
                      ↓
                 Message Storage
```

## API Endpoints

### Send Message
```bash
POST /api/chat/send
{
  "to": "918358918519",
  "type": "text",
  "content": "Hello! How can I help you?"
}
```

### Get Conversations
```bash
GET /api/chat/conversations?limit=20
```

### Get Conversation Messages
```bash
GET /api/chat/conversations/{conversationId}/messages?limit=50
```

### Get Chat Stats
```bash
GET /api/chat/stats
```

## Environment Variables

```bash
# WhatsApp API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Service Configuration
PORT=32103
CHAT_SERVICE_URL=http://localhost:32103
```

## Usage Examples

### Send a Text Message
```javascript
const response = await fetch('http://localhost:32101/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '918358918519',
    type: 'text',
    content: 'Hello from the chat service!'
  })
});
```

### Send a Template Message
```javascript
const response = await fetch('http://localhost:32101/api/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '918358918519',
    type: 'template',
    content: 'Template message',
    templateName: 'hello_world',
    templateLanguage: 'en_US'
  })
});
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
pnpm start
```

## Integration

The chat service integrates with:
- **Gateway**: Receives webhook events and provides API endpoints
- **WhatsApp API**: Sends messages and receives status updates
- **Message Storage**: Stores conversations and message history

## Next Steps

- [ ] Replace in-memory storage with database (PostgreSQL/MongoDB)
- [ ] Add AI-powered responses
- [ ] Implement message templates management
- [ ] Add file/media handling
- [ ] Add conversation analytics
- [ ] Implement user authentication
