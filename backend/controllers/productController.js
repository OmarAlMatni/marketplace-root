const productService = require('../services/productService');

async function list(req, res, next) {
  try {
    const { category, minPrice, maxPrice, search, sellerId, status, sortBy, sortDir, page, pageSize } = req.query;
    const result = await productService.list(
      {
        category,
        minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
        search,
        sellerId,
        status,
        sortBy,
        sortDir,
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 24,
      },
      req.user // may be undefined for anonymous visitors — optionalAuth populates this
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const product = await productService.getById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, category, price, stockCount, sku } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ error: 'title and price are required.' });
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await productService.create(req.user, {
      title,
      description,
      category,
      price: Number(price),
      sku,
      stockCount: stockCount !== undefined ? Number(stockCount) : undefined,
      imageUrl,
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const fields = { ...req.body };
    if (fields.price !== undefined) fields.price = Number(fields.price);
    if (fields.stockCount !== undefined) {
      fields.stock_count = Number(fields.stockCount);
      delete fields.stockCount;
    }
    if (req.file) {
      fields.image_url = `/uploads/${req.file.filename}`;
    }

    const product = await productService.update(req.params.id, req.user, fields);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.remove(req.params.id, req.user);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
