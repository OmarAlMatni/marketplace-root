const savedItemRepository = require('../repositories/savedItemRepository');

async function toggleSavedItem(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }
    
    const result = await savedItemRepository.toggleSavedItem(req.user.id, productId);
    
    // ✅ Return JSON with the saved status
    res.json({ isSaved: result.isSaved });
  } catch (err) {
    next(err);
  }
}

async function getSavedItems(req, res, next) {
  try {
    const items = await savedItemRepository.getSavedItems(req.user.id);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggleSavedItem, getSavedItems };