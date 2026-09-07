const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');
const chatRepository = require('../repositories/chatRepository');
const notificationRepository = require('../repositories/notificationRepository');

/**
 * P2P WebSockets & Live Room Multiplexing.
 *
 * Clients connect with their JWT in the socket auth handshake, join a
 * room_id for the listing they're negotiating on, and messages are
 * broadcast instantly to everyone in that room while an async write
 * persists the message to Postgres for history.
 */
function registerChatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token required.'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 socket connected: user=${socket.user.id}`);

    // Also join a personal room for cross-page notifications (new_notification).
    socket.join(`user:${socket.user.id}`);

    socket.on('join_room', async ({ room_id }) => {
      try {
        const allowed = await chatRepository.isParticipant(room_id, socket.user.id);
        if (!allowed) {
          socket.emit('error_message', { error: 'Not authorized to join this room.' });
          return;
        }
        socket.join(room_id);
        socket.emit('joined_room', { room_id });
      } catch (err) {
        socket.emit('error_message', { error: 'Failed to join room.' });
      }
    });

    socket.on('send_message', async ({ room_id, text }) => {
      try {
        const message = await chatService.postMessage({ roomId: room_id, senderId: socket.user.id, text });

        // Instant local broadcast to everyone currently in the room.
        io.to(room_id).emit('new_message', message);

        // Notify the other participant even if they're on a different page.
        const participants = await chatRepository.getParticipants(room_id);
        if (participants) {
          const recipientId = participants.buyer_id === socket.user.id ? participants.seller_id : participants.buyer_id;
          const notification = await notificationRepository.create({
            userId: recipientId,
            type: 'chat',
            title: 'New marketplace message',
            body: message.message_text.slice(0, 120),
          });
          io.to(`user:${recipientId}`).emit('new_notification', {
            type: 'chat',
            room_id,
            preview: message.message_text.slice(0, 80),
            notification_id: notification.id,
          });
        }
      } catch (err) {
        socket.emit('error_message', { error: err.message || 'Failed to send message.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 socket disconnected: user=${socket.user.id}`);
    });
  });
}

module.exports = { registerChatSocket };
