# OrdainedPro Backend API

A comprehensive backend system for the OrdainedPro Communication Portal that enables seamless email communication between wedding officiants and couples.

## 🚀 Features

### 📧 Email Integration
- **Two-way Email Communication**: Send and receive emails through the portal
- **SMTP/IMAP Integration**: Full email server connectivity
- **Email Parsing**: Automatic processing of incoming emails
- **Thread Management**: Conversation threading and organization
- **Auto-Reply System**: Configurable automatic responses

### 📅 Meeting Management
- **Calendar Invitations**: Send .ics calendar invites via email
- **Meeting Response Tracking**: Track ACCEPT/DECLINE/RESCHEDULE responses
- **Real-time Status Updates**: Live meeting status updates in portal

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Officiant and client role management
- **Rate Limiting**: API protection against abuse
- **Password Security**: Bcrypt hashing with salt

### 🔄 Real-time Communication
- **Socket.IO Integration**: Real-time message notifications
- **Typing Indicators**: Live typing status
- **Read Receipts**: Message read status tracking
- **Room Management**: Ceremony-based communication rooms

### 📊 Data Management
- **MongoDB Integration**: Robust document storage
- **Message Analytics**: Email communication insights
- **File Attachments**: Support for email attachments
- **Data Validation**: Comprehensive input validation

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Email**: Nodemailer (SMTP) + IMAP
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcryptjs
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js (v16+)
- MongoDB (v5+)
- Email account with SMTP/IMAP access (Gmail recommended)
- npm or yarn package manager

## ⚙️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to backend directory
cd ordained-pro-portal/backend

# Install dependencies
npm install

# Or with yarn
yarn install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Configure Email Settings

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use the app password in your `.env` file

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

### 4. Database Setup

```bash
# Start MongoDB (if local)
mongod

# Or start MongoDB service
sudo systemctl start mongodb
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new officiant |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| GET | `/me` | Get current user profile |
| PUT | `/profile` | Update user profile |
| POST | `/change-password` | Change password |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |
| POST | `/verify-token` | Verify JWT token |

### Message Routes (`/api/messages`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ceremony/:ceremonyId` | Get messages for ceremony |
| POST | `/send` | Send new email message |
| GET | `/thread/:threadId` | Get conversation thread |
| PUT | `/:messageId/read` | Mark message as read |
| GET | `/unread/count` | Get unread message count |
| DELETE | `/:messageId` | Delete message |
| PUT | `/:messageId/archive` | Archive/unarchive message |
| POST | `/bulk-action` | Bulk actions on messages |

### Email Routes (`/api/email`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send-meeting-invite` | Send calendar invitation |
| POST | `/process-response` | Process email responses |
| GET | `/status` | Get email service status |
| POST | `/test-connection` | Test email connection |
| POST | `/send-test` | Send test email |
| PUT | `/auto-reply/:ceremonyId` | Update auto-reply settings |
| GET | `/analytics/:ceremonyId` | Get email analytics |

## 📧 Email System Architecture

### Message Flow

```
1. Officiant sends message via portal
   ↓
2. Backend processes message
   ↓
3. SMTP server sends email to couple
   ↓
4. Couple replies via email client
   ↓
5. IMAP monitors inbox for replies
   ↓
6. Backend processes incoming email
   ↓
7. Message appears in portal
   ↓
8. Real-time notification via Socket.IO
```

### Email Processing Features

- **Automatic Email Parsing**: Extracts sender, recipients, subject, body
- **Thread Management**: Groups related emails together
- **Attachment Handling**: Processes and stores email attachments
- **Spam Protection**: Basic filtering and validation
- **Error Handling**: Robust error recovery and logging

## 🔄 Real-time Features

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `authenticate` | Client → Server | Authenticate socket connection |
| `join-ceremony` | Client → Server | Join ceremony room |
| `leave-ceremony` | Client → Server | Leave ceremony room |
| `typing-start` | Client → Server | User started typing |
| `typing-stop` | Client → Server | User stopped typing |
| `message-read` | Client → Server | Mark message as read |
| `new-message` | Server → Client | New message notification |
| `meeting-invitation` | Server → Client | Meeting invite sent |
| `meeting-response` | Server → Client | Meeting response received |
| `user-typing` | Server → Client | User typing indicator |
| `user-joined` | Server → Client | User joined ceremony |

## 📊 Database Schema

### Message Model
```javascript
{
  messageId: String,     // Unique message identifier
  ceremonyId: ObjectId,  // Reference to ceremony
  subject: String,       // Email subject
  body: String,          // Email body (plain text)
  htmlBody: String,      // Email body (HTML)
  senderEmail: String,   // Sender email address
  senderName: String,    // Sender display name
  senderType: String,    // officiant|bride|groom|system
  recipients: Array,     // Array of recipients
  sentAt: Date,          // Send timestamp
  readBy: Array,         // Read receipts
  attachments: Array,    // File attachments
  threadId: String,      // Conversation thread ID
  isReply: Boolean,      // Is this a reply?
  status: String         // sent|delivered|read|failed
}
```

### User Model
```javascript
{
  email: String,         // User email (unique)
  password: String,      // Hashed password
  firstName: String,     // First name
  lastName: String,      // Last name
  userType: String,      // officiant|bride|groom
  role: String,          // admin|officiant|client
  phone: String,         // Phone number
  isActive: Boolean,     // Account status
  preferences: Object,   // User preferences
  officiantInfo: Object  // Officiant-specific data
}
```

### Ceremony Model
```javascript
{
  ceremonyName: String,   // Wedding name
  officiantId: ObjectId,  // Officiant reference
  brideId: ObjectId,      // Bride reference
  groomId: ObjectId,      // Groom reference
  ceremonyDate: Date,     // Wedding date
  venue: Object,          // Venue information
  payment: Object,        // Payment details
  emailConfig: Object,    // Email settings
  status: String          // inquiry|booked|confirmed|completed
}
```

## 🧪 Testing

### Test Email Connection
```bash
# Test SMTP connection
curl -X POST http://localhost:5000/api/email/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test email
curl -X POST http://localhost:5000/api/email/send-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "body": "Test message"}'
```

### Test Message Sending
```bash
# Send message
curl -X POST http://localhost:5000/api/messages/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ceremonyId": "CEREMONY_ID",
    "subject": "Test Message",
    "body": "This is a test message",
    "recipients": [{"email": "test@example.com", "type": "to"}]
  }'
```

## 🔧 Configuration

### Email Settings
- **SMTP**: Configure outgoing email server
- **IMAP**: Configure incoming email monitoring
- **Auto-Reply**: Enable/disable automatic responses
- **Monitoring**: Set email checking intervals

### Security Settings
- **JWT Secret**: Change default JWT secret key
- **Rate Limiting**: Adjust request limits
- **CORS**: Configure allowed origins
- **Password Policy**: Set password requirements

### Performance Settings
- **Database Indexing**: Optimize query performance
- **Email Batch Processing**: Configure batch sizes
- **Socket.IO Scaling**: Configure for multiple servers

## 📈 Monitoring & Logging

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Email Service Status
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/email/status
```

### Logs
- Application logs in `logs/app.log`
- Email processing logs in console
- Error logs with stack traces
- Performance metrics

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong JWT secret
   - Configure production database
   - Set up production email server

2. **Security**
   - Enable HTTPS
   - Configure firewall
   - Set up SSL certificates
   - Enable security headers

3. **Performance**
   - Use PM2 for process management
   - Set up MongoDB replica set
   - Configure Redis for sessions
   - Enable gzip compression

4. **Monitoring**
   - Set up health checks
   - Configure log rotation
   - Monitor email delivery rates
   - Set up alerts

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

**Email Not Sending**
- Check SMTP credentials
- Verify network connectivity
- Check email provider settings
- Review error logs

**Email Not Receiving**
- Verify IMAP credentials
- Check inbox folder
- Ensure email monitoring is active
- Check firewall settings

**Authentication Errors**
- Verify JWT secret configuration
- Check token expiration
- Validate user permissions
- Review authentication logs

**Socket.IO Connection Issues**
- Check CORS configuration
- Verify WebSocket support
- Check firewall settings
- Review client-side implementation

## 📞 Support

For technical support or questions:
- Check the logs for error messages
- Verify environment configuration
- Test individual components
- Review API documentation

## 🔄 Updates & Maintenance

### Regular Maintenance
- Monitor email delivery rates
- Clean up old messages periodically
- Update dependencies regularly
- Backup database regularly

### Performance Optimization
- Monitor database queries
- Optimize email processing
- Scale Socket.IO connections
- Cache frequently accessed data
