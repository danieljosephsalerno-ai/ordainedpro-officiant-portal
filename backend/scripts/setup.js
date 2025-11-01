const mongoose = require('mongoose');
const User = require('../models/User');
const Ceremony = require('../models/Ceremony');
require('dotenv').config();

/**
 * Setup script for initializing the OrdainedPro backend
 */
class SetupManager {
  constructor() {
    this.dbConnected = false;
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ordained-pro', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.dbConnected = true;
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async createDefaultOfficiant() {
    try {
      // Check if default officiant already exists
      const existingOfficiant = await User.findOne({
        email: 'pastor.michael@ordainedpro.com',
        userType: 'officiant'
      });

      if (existingOfficiant) {
        console.log('ℹ️  Default officiant already exists');
        return existingOfficiant;
      }

      // Create default officiant
      const officiant = new User({
        email: 'pastor.michael@ordainedpro.com',
        password: 'password123', // Will be hashed automatically
        firstName: 'Michael',
        lastName: 'Adams',
        userType: 'officiant',
        phone: '(555) 987-6543',
        isEmailVerified: true,
        isActive: true,
        officiantInfo: {
          licenseNumber: 'WO-12345',
          yearsExperience: 5,
          specializations: ['Christian', 'Interfaith', 'Modern'],
          servicesOffered: ['Wedding Ceremonies', 'Vow Renewals', 'Commitment Ceremonies'],
          travelRadius: 50,
          baseFee: 500,
          credentials: ['Licensed Wedding Officiant', 'Ordained Minister'],
          website: 'https://ordainedpro.com'
        },
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          timezone: 'America/New_York',
          language: 'en'
        }
      });

      await officiant.save();
      console.log('✅ Default officiant created successfully');
      console.log(`   Email: ${officiant.email}`);
      console.log(`   Password: password123`);
      console.log(`   Name: ${officiant.fullName}`);

      return officiant;
    } catch (error) {
      console.error('❌ Error creating default officiant:', error.message);
      throw error;
    }
  }

  async createSampleCouple() {
    try {
      // Check if sample couple already exists
      const existingBride = await User.findOne({
        email: 'sarah.johnson@email.com',
        userType: 'bride'
      });

      if (existingBride) {
        console.log('ℹ️  Sample couple already exists');
        return;
      }

      // Create bride
      const bride = new User({
        email: 'sarah.johnson@email.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        userType: 'bride',
        phone: '(555) 123-4567',
        isEmailVerified: true,
        isActive: true,
        preferences: {
          emailNotifications: true,
          smsNotifications: true,
          timezone: 'America/New_York',
          language: 'en'
        }
      });

      await bride.save();

      // Create groom
      const groom = new User({
        email: 'david.chen@email.com',
        firstName: 'David',
        lastName: 'Chen',
        userType: 'groom',
        phone: '(555) 234-5678',
        isEmailVerified: true,
        isActive: true,
        partnerUserId: bride._id,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          timezone: 'America/New_York',
          language: 'en'
        }
      });

      await groom.save();

      // Update bride with partner reference
      bride.partnerUserId = groom._id;
      await bride.save();

      console.log('✅ Sample couple created successfully');
      console.log(`   Bride: ${bride.fullName} (${bride.email})`);
      console.log(`   Groom: ${groom.fullName} (${groom.email})`);

      return { bride, groom };
    } catch (error) {
      console.error('❌ Error creating sample couple:', error.message);
      throw error;
    }
  }

  async createSampleCeremony() {
    try {
      // Get users
      const officiant = await User.findOne({
        email: 'pastor.michael@ordainedpro.com',
        userType: 'officiant'
      });

      const bride = await User.findOne({
        email: 'sarah.johnson@email.com',
        userType: 'bride'
      });

      const groom = await User.findOne({
        email: 'david.chen@email.com',
        userType: 'groom'
      });

      if (!officiant || !bride || !groom) {
        console.log('❌ Required users not found for creating ceremony');
        return;
      }

      // Check if ceremony already exists
      const existingCeremony = await Ceremony.findOne({
        officiantId: officiant._id,
        brideId: bride._id,
        groomId: groom._id
      });

      if (existingCeremony) {
        console.log('ℹ️  Sample ceremony already exists');
        return existingCeremony;
      }

      // Create ceremony
      const ceremony = new Ceremony({
        ceremonyName: 'Sarah & David\'s Wedding',
        officiantId: officiant._id,
        brideId: bride._id,
        groomId: groom._id,
        ceremonyDate: new Date('2024-08-25'),
        ceremonyTime: '16:00',
        timezone: 'America/New_York',
        duration: 45,
        venue: {
          name: 'Sunset Gardens',
          address: {
            street: '123 Rose Avenue',
            city: 'Garden City',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          },
          contactPerson: {
            name: 'Jennifer Smith',
            phone: '(555) 555-0123',
            email: 'events@sunsetgardens.com'
          },
          venueType: 'garden'
        },
        expectedGuests: 75,
        ceremonyType: 'interfaith',
        traditions: ['Unity Candle', 'Ring Exchange', 'Personal Vows'],
        specialRequests: 'Outdoor ceremony with sunset timing. Include readings from both Christian and Buddhist traditions.',
        communicationChannels: {
          email: true,
          phone: true,
          sms: false
        },
        payment: {
          totalAmount: 800,
          depositAmount: 300,
          paidAmount: 300,
          currency: 'USD',
          paymentStatus: 'deposit_paid',
          dueDate: new Date('2024-08-18')
        },
        emailConfig: {
          autoReplyEnabled: true,
          autoReplyMessage: 'Thank you for your message! We\'ll get back to you within 24 hours. For urgent matters, please call (555) 987-6543.'
        },
        status: 'confirmed'
      });

      await ceremony.save();

      console.log('✅ Sample ceremony created successfully');
      console.log(`   Ceremony: ${ceremony.ceremonyName}`);
      console.log(`   Date: ${ceremony.ceremonyDate.toDateString()}`);
      console.log(`   Venue: ${ceremony.venue.name}`);
      console.log(`   Status: ${ceremony.status}`);

      return ceremony;
    } catch (error) {
      console.error('❌ Error creating sample ceremony:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    try {
      console.log('📊 Creating database indexes...');

      // Message indexes
      await mongoose.connection.db.collection('messages').createIndex({ ceremonyId: 1, sentAt: -1 });
      await mongoose.connection.db.collection('messages').createIndex({ senderEmail: 1, sentAt: -1 });
      await mongoose.connection.db.collection('messages').createIndex({ threadId: 1, sentAt: 1 });
      await mongoose.connection.db.collection('messages').createIndex({ messageId: 1 }, { unique: true });

      // User indexes
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ userType: 1 });

      // Ceremony indexes
      await mongoose.connection.db.collection('ceremonies').createIndex({ officiantId: 1, ceremonyDate: -1 });
      await mongoose.connection.db.collection('ceremonies').createIndex({ ceremonyDate: 1 });
      await mongoose.connection.db.collection('ceremonies').createIndex({ status: 1 });

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment configuration...');

    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.log('⚠️  Missing environment variables:');
      missing.forEach(varName => console.log(`   - ${varName}`));
      console.log('');
      console.log('Please check your .env file and ensure all required variables are set.');
      return false;
    }

    console.log('✅ Environment configuration is complete');
    return true;
  }

  async testEmailConnection() {
    try {
      console.log('📧 Testing email connection...');

      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.verify();
      console.log('✅ Email connection successful');
      return true;
    } catch (error) {
      console.log('❌ Email connection failed:', error.message);
      console.log('Please check your SMTP configuration in .env file');
      return false;
    }
  }

  async runFullSetup() {
    console.log('🚀 Starting OrdainedPro Backend Setup...\n');

    // Validate environment
    const envValid = await this.validateEnvironment();
    if (!envValid) return false;

    // Connect to database
    const dbConnected = await this.connectDatabase();
    if (!dbConnected) return false;

    // Test email connection
    await this.testEmailConnection();

    // Create database indexes
    await this.createIndexes();

    // Create sample data
    await this.createDefaultOfficiant();
    await this.createSampleCouple();
    await this.createSampleCeremony();

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Quick Start Guide:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Login with: pastor.michael@ordainedpro.com / password123');
    console.log('3. Test the email system with the sample ceremony');
    console.log('4. Check the API documentation in README.md');
    console.log('\n🔧 Next Steps:');
    console.log('- Change the default password');
    console.log('- Configure your production email settings');
    console.log('- Set up SSL certificates for production');
    console.log('- Review security settings');

    return true;
  }

  async cleanup() {
    if (this.dbConnected) {
      await mongoose.disconnect();
      console.log('📪 Disconnected from database');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new SetupManager();

  setup.runFullSetup()
    .then((success) => {
      if (success) {
        console.log('\n✅ Setup completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Setup failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Setup error:', error);
      process.exit(1);
    })
    .finally(() => {
      setup.cleanup();
    });
}

module.exports = SetupManager;
