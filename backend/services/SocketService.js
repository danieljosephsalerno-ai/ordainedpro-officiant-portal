class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userRooms = new Map(); // userId -> Set of room names

    this.initializeSocketHandlers();
  }

  /**
   * Initialize Socket.IO event handlers
   */
  initializeSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token, userId } = data;

          // In production, verify the JWT token here
          // For now, we'll trust the client-provided userId

          if (userId) {
            this.connectedUsers.set(userId, socket.id);
            socket.userId = userId;

            console.log(`👤 User ${userId} authenticated with socket ${socket.id}`);

            socket.emit('authenticated', { success: true });
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid authentication' });
          }
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authenticated', { success: false, error: 'Authentication failed' });
        }
      });

      // Handle joining ceremony rooms
      socket.on('join-ceremony', async (ceremonyId) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }

          const roomName = `ceremony-${ceremonyId}`;

          // Join the room
          socket.join(roomName);

          // Track user rooms
          if (!this.userRooms.has(socket.userId)) {
            this.userRooms.set(socket.userId, new Set());
          }
          this.userRooms.get(socket.userId).add(roomName);

          console.log(`👤 User ${socket.userId} joined ceremony room: ${roomName}`);

          // Notify others in the room
          socket.to(roomName).emit('user-joined', {
            userId: socket.userId,
            ceremonyId
          });

          socket.emit('ceremony-joined', { ceremonyId, room: roomName });

        } catch (error) {
          console.error('Error joining ceremony room:', error);
          socket.emit('error', { message: 'Failed to join ceremony room' });
        }
      });

      // Handle leaving ceremony rooms
      socket.on('leave-ceremony', (ceremonyId) => {
        try {
          const roomName = `ceremony-${ceremonyId}`;

          socket.leave(roomName);

          if (this.userRooms.has(socket.userId)) {
            this.userRooms.get(socket.userId).delete(roomName);
          }

          console.log(`👤 User ${socket.userId} left ceremony room: ${roomName}`);

          // Notify others in the room
          socket.to(roomName).emit('user-left', {
            userId: socket.userId,
            ceremonyId
          });

        } catch (error) {
          console.error('Error leaving ceremony room:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        try {
          const { ceremonyId, userName } = data;
          const roomName = `ceremony-${ceremonyId}`;

          socket.to(roomName).emit('user-typing', {
            userId: socket.userId,
            userName,
            ceremonyId
          });

        } catch (error) {
          console.error('Error handling typing start:', error);
        }
      });

      socket.on('typing-stop', (data) => {
        try {
          const { ceremonyId } = data;
          const roomName = `ceremony-${ceremonyId}`;

          socket.to(roomName).emit('user-stopped-typing', {
            userId: socket.userId,
            ceremonyId
          });

        } catch (error) {
          console.error('Error handling typing stop:', error);
        }
      });

      // Handle message read receipts
      socket.on('message-read', (data) => {
        try {
          const { messageId, ceremonyId } = data;
          const roomName = `ceremony-${ceremonyId}`;

          socket.to(roomName).emit('message-read-receipt', {
            messageId,
            userId: socket.userId,
            readAt: new Date().toISOString()
          });

        } catch (error) {
          console.error('Error handling message read:', error);
        }
      });

      // Handle meeting responses
      socket.on('meeting-response', (data) => {
        try {
          const { ceremonyId, response, meetingId } = data;
          const roomName = `ceremony-${ceremonyId}`;

          // Emit to all users in the ceremony room
          this.io.to(roomName).emit('meeting-response-update', {
            meetingId,
            response,
            userId: socket.userId,
            timestamp: new Date().toISOString()
          });

          console.log(`📅 Meeting response received: ${response} for meeting ${meetingId}`);

        } catch (error) {
          console.error('Error handling meeting response:', error);
        }
      });

      // Handle connection status
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);

        if (socket.userId) {
          // Remove from connected users
          this.connectedUsers.delete(socket.userId);

          // Notify ceremony rooms about user disconnect
          if (this.userRooms.has(socket.userId)) {
            const userRooms = this.userRooms.get(socket.userId);
            userRooms.forEach(roomName => {
              socket.to(roomName).emit('user-disconnected', {
                userId: socket.userId,
                timestamp: new Date().toISOString()
              });
            });

            // Clear user rooms
            this.userRooms.delete(socket.userId);
          }

          console.log(`👤 User ${socket.userId} disconnected`);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId, event, data) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error emitting to user:', error);
      return false;
    }
  }

  /**
   * Emit event to all users in a room
   */
  emitToRoom(roomName, event, data) {
    try {
      this.io.to(roomName).emit(event, data);
      console.log(`📡 Emitted ${event} to room ${roomName}`);
      return true;
    } catch (error) {
      console.error('Error emitting to room:', error);
      return false;
    }
  }

  /**
   * Emit event to all connected sockets
   */
  emitToAll(event, data) {
    try {
      this.io.emit(event, data);
      console.log(`📡 Emitted ${event} to all connected users`);
      return true;
    } catch (error) {
      console.error('Error emitting to all:', error);
      return false;
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get users in specific room
   */
  async getUsersInRoom(roomName) {
    try {
      const sockets = await this.io.in(roomName).fetchSockets();
      return sockets.map(socket => ({
        socketId: socket.id,
        userId: socket.userId
      })).filter(user => user.userId);
    } catch (error) {
      console.error('Error getting users in room:', error);
      return [];
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get user's active rooms
   */
  getUserRooms(userId) {
    const rooms = this.userRooms.get(userId);
    return rooms ? Array.from(rooms) : [];
  }

  /**
   * Force disconnect user
   */
  disconnectUser(userId, reason = 'Forced disconnect') {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('force-disconnect', { reason });
          socket.disconnect(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error disconnecting user:', error);
      return false;
    }
  }

  /**
   * Send notification to ceremony participants
   */
  notifyCeremonyParticipants(ceremonyId, event, data) {
    const roomName = `ceremony-${ceremonyId}`;
    return this.emitToRoom(roomName, event, {
      ...data,
      ceremonyId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send new message notification
   */
  notifyNewMessage(ceremonyId, message, sender) {
    return this.notifyCeremonyParticipants(ceremonyId, 'new-message', {
      message: {
        id: message._id,
        subject: message.subject,
        body: message.body,
        senderName: message.senderName,
        senderType: message.senderType,
        sentAt: message.sentAt,
        formattedTime: message.formattedTime
      },
      sender: {
        id: sender._id,
        name: sender.fullName,
        type: sender.userType
      }
    });
  }

  /**
   * Send meeting invitation notification
   */
  notifyMeetingInvitation(ceremonyId, meeting, organizer) {
    return this.notifyCeremonyParticipants(ceremonyId, 'meeting-invitation', {
      meeting: {
        subject: meeting.subject,
        date: meeting.date,
        time: meeting.time,
        type: meeting.meetingType,
        location: meeting.location
      },
      organizer: {
        name: organizer.fullName,
        email: organizer.email
      }
    });
  }

  /**
   * Send task reminder notification
   */
  notifyTaskReminder(ceremonyId, task, assignee) {
    return this.notifyCeremonyParticipants(ceremonyId, 'task-reminder', {
      task: {
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority
      },
      assignee: {
        name: assignee.fullName
      }
    });
  }

  /**
   * Send payment reminder notification
   */
  notifyPaymentReminder(ceremonyId, payment, recipient) {
    return this.notifyCeremonyParticipants(ceremonyId, 'payment-reminder', {
      payment: {
        amount: payment.amount,
        dueDate: payment.dueDate,
        description: payment.description
      },
      recipient: {
        name: recipient.fullName
      }
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalRooms: Array.from(this.userRooms.values()).reduce((total, rooms) => total + rooms.size, 0),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = SocketService;
