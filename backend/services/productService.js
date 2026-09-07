const { v4: uuidv4 } = require('uuid');
const productRepository = require('../repositories/productRepository');
const { deleteUploadedImage } = require('../config/upload');

const STAFF_ROLES = new Set(['admin', 'super_admin']);

/**
 * Public/catalog listing. Anonymous visitors and regular buyers only ever
 * see 'approved' listings. A seller viewing their own listings (sellerId
 * matches the requester) or any admin/super_admin sees every status so
 * they can track pending/rejected items.
 */
async function list(filters, requester) {
  let status = filters.status;

  if (!status) {
    const isOwnListingsQuery = filters.sellerId && requester && filters.sellerId === requester.id;
    const isStaff = requester && STAFF_ROLES.has(requester.role);
    status = isOwnListingsQuery || isStaff ? undefined : 'approved';
  }

  return productRepository.listProducts({ ...filters, status });
}

async function getById(id) {
  const product = await productRepository.findById(id);
  if (!product) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }
  return product;
}

/**
 * New listings from regular sellers start 'pending' and need admin
 * approval before they appear in the public catalog. Listings created
 * directly by an admin/super_admin are auto-approved.
 */
async function create(seller, data) {
  const sku = data.sku || `SKU-${uuidv4().slice(0, 8).toUpperCase()}`;
  const status = STAFF_ROLES.has(seller.role) ? 'approved' : 'pending';
  return productRepository.create({ sellerId: seller.id, ...data, sku, status });
}

/**
 * Owner editing their own listing. Any edit from a non-staff seller resets
 * the listing back to 'pending' so admins re-review the changed content.
 */
async function update(id, seller, fields) {
  const patch = { ...fields };
  if (!STAFF_ROLES.has(seller.role)) {
    patch.status = 'pending';
    patch.rejection_feedback = null;
  }

  const existing = await productRepository.findById(id);
  const updated = await productRepository.update(id, seller.id, patch);
  if (!updated) {
    const err = new Error('Product not found or you do not own this listing.');
    err.status = 404;
    throw err;
  }

  // If the image was replaced, clean up the old file from disk.
  if (existing?.image_url && fields.image_url && fields.image_url !== existing.image_url) {
    deleteUploadedImage(existing.image_url);
  }

  return updated;
}

async function remove(id, seller) {
  const removed = await productRepository.remove(id, seller.id);
  if (!removed) {
    const err = new Error('Product not found or you do not own this listing.');
    err.status = 404;
    throw err;
  }
  if (removed.image_url) {
    deleteUploadedImage(removed.image_url);
  }
}

module.exports = { list, getById, create, update, remove };
