const productRepository = require('../repositories/productRepository');
const chatRepository = require('../repositories/chatRepository');

async function openRoom({ productId, buyerId }) {
  const product = await productRepository.findById(productId);
  if (!product) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  if (product.seller_id === buyerId) {
    const err = new Error('You cannot start a negotiation on your own listing.');
    err.status = 400;
    throw err;
  }
  return chatRepository.findOrCreateRoom({ productId, buyerId, sellerId: product.seller_id });
}

async function getHistory(roomId, userId) {
  const allowed = await chatRepository.isParticipant(roomId, userId);
  if (!allowed) {
    const err = new Error('You are not a participant in this chat room.');
    err.status = 403;
    throw err;
  }
  return chatRepository.listMessages(roomId);
}

async function postMessage({ roomId, senderId, text }) {
  const allowed = await chatRepository.isParticipant(roomId, senderId);
  if (!allowed) {
    const err = new Error('You are not a participant in this chat room.');
    err.status = 403;
    throw err;
  }
  if (!text || !text.trim()) {
    const err = new Error('Message text cannot be empty.');
    err.status = 400;
    throw err;
  }
  return chatRepository.saveMessage({ roomId, senderId, text: text.trim() });
}

async function listRooms(userId) {
  return chatRepository.listRoomsForUser(userId);
}

module.exports = { openRoom, getHistory, postMessage, listRooms };
