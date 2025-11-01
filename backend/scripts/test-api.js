const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

class APITester {
  constructor() {
    this.authToken = null;
    this.ceremonyId = null;
  }

  async login(email = 'pastor.michael@ordainedpro.com', password = 'password123') {
    try {
      console.log('🔐 Logging in...');

      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });

      this.authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`   User: ${response.data.user.fullName}`);
      console.log(`   Role: ${response.data.user.userType}`);

      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  getAuthHeaders() {
    if (!this.authToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  async testHealthCheck() {
    try {
      console.log('\n🏥 Testing health check...');

      const response = await axios.get(`${API_BASE}/health`);
      console.log('✅ Health check passed');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Timestamp: ${response.data.timestamp}`);

      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      throw error;
    }
  }

  async testEmailStatus() {
    try {
      console.log('\n📧 Testing email service status...');

      const response = await axios.get(`${API_BASE}/email/status`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Email service status retrieved');
      console.log(`   SMTP Connected: ${response.data.emailService.smtpConnected}`);
      console.log(`   IMAP Connected: ${response.data.emailService.imapConnected}`);
      console.log(`   Monitoring: ${response.data.emailService.isMonitoring}`);

      return response.data;
    } catch (error) {
      console.error('❌ Email status check failed:', error.response?.data || error.message);
    }
  }

  async findSampleCeremony() {
    try {
      console.log('\n🔍 Finding sample ceremony...');

      // In a real implementation, you'd have an endpoint to get user's ceremonies
      // For testing, we'll use a known ceremony ID or create one
      const mongoose = require('mongoose');
      const Ceremony = require('../models/Ceremony');

      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ordained-pro');

      const ceremony = await Ceremony.findOne({ status: 'confirmed' })
        .populate('officiantId', 'firstName lastName email')
        .populate('brideId', 'firstName lastName email')
        .populate('groomId', 'firstName lastName email');

      await mongoose.disconnect();

      if (ceremony) {
        this.ceremonyId = ceremony._id.toString();
        console.log('✅ Sample ceremony found');
        console.log(`   Ceremony: ${ceremony.ceremonyName}`);
        console.log(`   Officiant: ${ceremony.officiantId.fullName}`);
        console.log(`   Couple: ${ceremony.brideId.firstName} & ${ceremony.groomId.firstName}`);

        return ceremony;
      } else {
        console.log('⚠️  No sample ceremony found. Run setup script first.');
        return null;
      }
    } catch (error) {
      console.error('❌ Error finding ceremony:', error.message);
      return null;
    }
  }

  async testSendMessage() {
    try {
      if (!this.ceremonyId) {
        console.log('⚠️  No ceremony ID available. Skipping message test.');
        return;
      }

      console.log('\n📤 Testing send message...');

      const messageData = {
        ceremonyId: this.ceremonyId,
        subject: 'Test Message from API',
        body: 'This is a test message sent via the API testing script. It demonstrates the email functionality of the OrdainedPro portal.',
        recipients: [
          {
            email: 'sarah.johnson@email.com',
            name: 'Sarah Johnson',
            type: 'to'
          },
          {
            email: 'david.chen@email.com',
            name: 'David Chen',
            type: 'to'
          }
        ]
      };

      const response = await axios.post(`${API_BASE}/messages/send`, messageData, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Message sent successfully');
      console.log(`   Message ID: ${response.data.messageId}`);

      return response.data;
    } catch (error) {
      console.error('❌ Send message failed:', error.response?.data || error.message);
    }
  }

  async testGetMessages() {
    try {
      if (!this.ceremonyId) {
        console.log('⚠️  No ceremony ID available. Skipping get messages test.');
        return;
      }

      console.log('\n📥 Testing get messages...');

      const response = await axios.get(`${API_BASE}/messages/ceremony/${this.ceremonyId}`, {
        headers: this.getAuthHeaders(),
        params: {
          page: 1,
          limit: 10
        }
      });

      console.log('✅ Messages retrieved successfully');
      console.log(`   Total messages: ${response.data.pagination.totalMessages}`);
      console.log(`   Current page: ${response.data.pagination.currentPage}`);

      if (response.data.messages.length > 0) {
        console.log('\n📋 Recent messages:');
        response.data.messages.slice(0, 3).forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.subject}`);
          console.log(`      From: ${msg.senderName} (${msg.senderType})`);
          console.log(`      Sent: ${msg.formattedDate} at ${msg.formattedTime}`);
        });
      }

      return response.data;
    } catch (error) {
      console.error('❌ Get messages failed:', error.response?.data || error.message);
    }
  }

  async testSendMeetingInvite() {
    try {
      if (!this.ceremonyId) {
        console.log('⚠️  No ceremony ID available. Skipping meeting invite test.');
        return;
      }

      console.log('\n📅 Testing send meeting invite...');

      const meetingData = {
        ceremonyId: this.ceremonyId,
        subject: 'Pre-Wedding Consultation - API Test',
        body: 'This is a test meeting invitation sent via the API. We\'ll discuss your ceremony preferences and timeline.\n\nPlease reply with ACCEPT or DECLINE.',
        date: '2024-09-15',
        time: '14:00',
        duration: 60,
        meetingType: 'video',
        responseDeadline: '2024-09-13'
      };

      const response = await axios.post(`${API_BASE}/email/send-meeting-invite`, meetingData, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Meeting invitation sent successfully');
      console.log(`   Message ID: ${response.data.messageId}`);

      return response.data;
    } catch (error) {
      console.error('❌ Send meeting invite failed:', error.response?.data || error.message);
    }
  }

  async testUnreadCount() {
    try {
      console.log('\n📊 Testing unread message count...');

      const response = await axios.get(`${API_BASE}/messages/unread/count`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Unread count retrieved');
      console.log(`   Unread messages: ${response.data.unreadCount}`);

      return response.data;
    } catch (error) {
      console.error('❌ Unread count failed:', error.response?.data || error.message);
    }
  }

  async testEmailAnalytics() {
    try {
      if (!this.ceremonyId) {
        console.log('⚠️  No ceremony ID available. Skipping analytics test.');
        return;
      }

      console.log('\n📈 Testing email analytics...');

      const response = await axios.get(`${API_BASE}/email/analytics/${this.ceremonyId}`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Email analytics retrieved');
      console.log(`   Total messages: ${response.data.analytics.totalMessages || 0}`);
      console.log(`   Meeting invites: ${response.data.meetingInvites}`);
      console.log(`   Meeting responses: ${response.data.meetingResponses}`);
      console.log(`   Response rate: ${response.data.responseRate}%`);

      return response.data;
    } catch (error) {
      console.error('❌ Email analytics failed:', error.response?.data || error.message);
    }
  }

  async runAllTests() {
    try {
      console.log('🧪 Starting API Testing Suite for OrdainedPro Backend\n');
      console.log('=' .repeat(60));

      // Basic tests
      await this.testHealthCheck();
      await this.login();
      await this.testEmailStatus();

      // Find sample data
      await this.findSampleCeremony();

      // Message tests
      await this.testGetMessages();
      await this.testUnreadCount();
      await this.testSendMessage();

      // Meeting tests
      await this.testSendMeetingInvite();

      // Analytics tests
      await this.testEmailAnalytics();

      console.log('\n' + '=' .repeat(60));
      console.log('🎉 All API tests completed!');
      console.log('\n✅ Test Results Summary:');
      console.log('   - Health check: PASSED');
      console.log('   - Authentication: PASSED');
      console.log('   - Email service: CHECKED');
      console.log('   - Message retrieval: TESTED');
      console.log('   - Message sending: TESTED');
      console.log('   - Meeting invites: TESTED');
      console.log('   - Analytics: TESTED');

      console.log('\n📋 Next Steps:');
      console.log('   1. Check your email inbox for test messages');
      console.log('   2. Test email replies to verify IMAP monitoring');
      console.log('   3. Use the frontend portal to see real-time updates');
      console.log('   4. Monitor server logs for email processing');

    } catch (error) {
      console.error('\n💥 Test suite failed:', error.message);
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('   - Ensure the server is running (npm run dev)');
      console.log('   - Check your .env configuration');
      console.log('   - Verify MongoDB is running');
      console.log('   - Run the setup script (npm run setup)');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🏁 Testing complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = APITester;
