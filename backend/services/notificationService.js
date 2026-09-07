const notificationRepository = require('../repositories/notificationRepository');

let io;

function setSocketServer(socketServer) {
  io = socketServer;
}

async function notifyUser({ userId, type, title, body, data = {} }) {
  const notification = await notificationRepository.create({ userId, type, title, body });

  io?.to(`user:${userId}`).emit('new_notification', {
    id: notification.id,
    type,
    title,
    body,
    created_at: notification.created_at,
    ...data,
  });

  return notification;
}

module.exports = { setSocketServer, notifyUser };
