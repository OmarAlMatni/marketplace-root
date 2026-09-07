const chatService = require('../services/chatService');

async function openRoom(req, res, next) {
  try {
    const { productId } = req.body;
    const room = await chatService.openRoom({ productId, buyerId: req.user.id });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

async function listRooms(req, res, next) {
  try {
    const rooms = await chatService.listRooms(req.user.id);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const messages = await chatService.getHistory(req.params.roomId, req.user.id);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

module.exports = { openRoom, listRooms, getHistory };
