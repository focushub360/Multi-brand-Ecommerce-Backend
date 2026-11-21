import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product } from './product.model.js';
import { Category } from '../categories/category.model.js';
import { Dealer } from '../dealers/dealer.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { InventoryTransaction } from '../inventory/inventoryTransaction.model.js';
import { ApiError } from '../../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_PRODUCTS_FILE = path.resolve(__dirname, '../../../data/seed-products.json');

export class ProductService {
  /**
   * Helper: Synchronize active products from MongoDB with seed-products.json
   */
  static async syncProductsJson() {
    try {
      const activeProducts = await Product.find({ status: { $ne: 'Archived' } })
        .sort({ createdAt: -1 })
        .lean();

      const serialized = activeProducts.map((p) => ({
        name: p.name,
        sku: p.sku,
        slug: p.slug,
        categoryName: p.categoryName,
        subcategory: p.subcategory,
        brand: p.brand || 'Generic',
        description: p.description,
        price: p.price,
        mrp: p.mrp || p.price,
        discount: p.discount || 0,
        stock: p.stock,
        rating: p.rating || 4.5,
        reviewCount: p.reviewCount || 10,
        image: p.image || (p.images?.[0] || ''),
        images: p.images?.length ? p.images : (p.image ? [p.image] : []),
        specs: p.specs || {},
        highlights: p.highlights || []
      }));

      await fs.writeFile(SEED_PRODUCTS_FILE, JSON.stringify(serialized, null, 2), 'utf8');
      console.log(`[ProductService] Synchronized ${serialized.length} products to data/seed-products.json`);
    } catch (err) {
      console.warn('[ProductService] Warning syncing seed-products.json:', err.message);
    }
  }
  /**
   * Create Product (Strict Category Enforcement)
   */
  static async createProduct(dealerIdentity, data) {
    if (!dealerIdentity) {
      throw ApiError.unauthorized('Dealer authentication required to create products.');
    }

    // 1. Resolve Target Category
    let category = null;
    if (data.category.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(data.category);
    } else {
      category = await Category.findOne({
        $or: [{ name: data.category }, { slug: data.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-') }]
      });
    }

    if (!category) {
      throw ApiError.badRequest('Selected category does not exist.');
    }

    // 2. CRITICAL SERVER-SIDE CHECK: Category must match Dealer's registered primaryCategory
    const dealerPrimaryCatId = dealerIdentity.primaryCategory.toString();
    const dealerPrimaryCatName = dealerIdentity.primaryCategoryName.toLowerCase();
    const targetCatId = category._id.toString();
    const targetCatName = category.name.toLowerCase();

    if (dealerPrimaryCatId !== targetCatId && dealerPrimaryCatName !== targetCatName) {
      throw ApiError.forbidden(
        `Category Access Denied: Your dealership is restricted to '${dealerIdentity.primaryCategoryName}'. You cannot create products in '${category.name}'.`
      );
    }

    // 3. Verify SKU uniqueness
    const cleanSku = data.sku.toUpperCase().trim();
    const existingSku = await Product.findOne({ sku: cleanSku });
    if (existingSku) {
      throw ApiError.conflict(`A product with SKU '${cleanSku}' already exists.`);
    }

    // 4. Calculate discount
    const price = Number(data.price);
    const mrp = Number(data.mrp || price);
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Create Product
    const product = new Product({
      dealer: dealerIdentity.id,
      dealerCode: dealerIdentity.dealerCode,
      dealerName: dealerIdentity.businessName,
      name: data.name.trim(),
      slug,
      sku: cleanSku,
      category: category._id,
      categoryName: category.name,
      subcategory: data.subcategory.trim(),
      brand: (data.brand || 'Generic').trim(),
      description: data.description.trim(),
      price,
      mrp,
      discount,
      gstRate: data.gstRate ?? 18,
      stock: Number(data.stock) || 0,
      threshold: Number(data.threshold) || 10,
      status: data.status || 'Active',
      image: data.image || data.images?.[0] || '/images/card-agri-clean.png',
      images: data.images?.length ? data.images : [data.image || '/images/card-agri-clean.png'],
      specs: data.specs || data.specifications || {},
      highlights: data.highlights || [],
      warranty: data.warranty || 'Standard 1 Year Warranty'
    });

    await product.save();

    // 6. Automatically register in Inventory ledger
    try {
      const inventory = new Inventory({
        product: product._id,
        dealer: dealerIdentity.id,
        sku: cleanSku,
        currentStock: product.stock,
        threshold: product.threshold,
        locationBay: 'Bay 01',
        status: product.stock > product.threshold ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'
      });
      await inventory.save();

      if (product.stock > 0) {
        await InventoryTransaction.create({
          product: product._id,
          dealer: dealerIdentity.id,
          type: 'PURCHASE_RESTOCK',
          quantityChange: product.stock,
          balanceAfter: product.stock,
          referenceId: cleanSku,
          reason: 'Initial stock intake upon listing creation',
          performedBy: dealerIdentity.user || dealerIdentity.id
        });
      }
    } catch (e) {
      console.warn('Inventory auto-intake warning:', e.message);
    }

    // Auto-sync active products with seed-products.json
    ProductService.syncProductsJson().catch(() => {});

    return product;
  }

  /**
   * Edit Dealer Product (Ownership Enforced)
   */
  static async updateDealerProduct(dealerId, productId, updateData) {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (product.dealer.toString() !== dealerId.toString()) {
      throw ApiError.forbidden('You do not own this product and cannot modify it.');
    }

    // Update safe fields
    if (updateData.name) product.name = updateData.name.trim();
    if (updateData.description) product.description = updateData.description.trim();
    if (updateData.price !== undefined) {
      product.price = Number(updateData.price);
      if (product.mrp > product.price) {
        product.discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
      }
    }
    if (updateData.mrp !== undefined) {
      product.mrp = Number(updateData.mrp);
      if (product.mrp > product.price) {
        product.discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
      }
    }
    if (updateData.stock !== undefined) {
      const oldStock = product.stock;
      const newStock = Number(updateData.stock);
      product.stock = newStock;

      // Update Inventory
      await Inventory.findOneAndUpdate(
        { product: product._id },
        { 
          currentStock: newStock,
          status: newStock > product.threshold ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock' 
        }
      );

      if (oldStock !== newStock) {
        await InventoryTransaction.create({
          product: product._id,
          dealer: dealerId,
          type: 'MANUAL_ADJUSTMENT',
          quantityChange: newStock - oldStock,
          balanceAfter: newStock,
          referenceId: product.sku,
          reason: 'Manual dealer product update',
          performedBy: dealerId
        });
      }
    }
    if (updateData.threshold !== undefined) product.threshold = Number(updateData.threshold);
    if (updateData.status) product.status = updateData.status;
    if (updateData.image) product.image = updateData.image;
    if (updateData.images) product.images = updateData.images;
    if (updateData.specs) product.specs = updateData.specs;
    if (updateData.highlights) product.highlights = updateData.highlights;
    if (updateData.warranty) product.warranty = updateData.warranty;

    await product.save();
    ProductService.syncProductsJson().catch(() => {});
    return product;
  }

  /**
   * Soft Delete / Archive Dealer Product
   */
  static async deleteDealerProduct(dealerId, productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (product.dealer.toString() !== dealerId.toString()) {
      throw ApiError.forbidden('You do not own this product.');
    }

    product.status = 'Archived';
    await product.save();
    ProductService.syncProductsJson().catch(() => {});

    return { message: `Product '${product.name}' archived successfully.` };
  }

  /**
   * Get Dealer's Own Products
   */
  static async getDealerProducts(dealerId, { page = 1, limit = 20, status = '' }) {
    const filter = { dealer: dealerId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Public Catalog Query (Search, Filter, Sort, Pagination)
   */
  static async queryPublicCatalog(filters = {}) {
    const query = { status: 'Active' };

    // 1. Category filter
    if (filters.category) {
      if (filters.category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = filters.category;
      } else {
        const cleanCat = filters.category.trim();
        const cat = await Category.findOne({
          $or: [
            { name: cleanCat },
            { name: new RegExp(`^${cleanCat}`, 'i') },
            { slug: cleanCat.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-') },
            { slug: new RegExp(`^${cleanCat.toLowerCase()}`, 'i') }
          ]
        });
        if (cat) {
          query.category = cat._id;
        }
      }
    }

    // 2. Subcategory filter
    if (filters.subcategory) {
      query.subcategory = { $regex: new RegExp(`^${filters.subcategory}$`, 'i') };
    }

    // 3. Brand filter
    if (filters.brand) {
      query.brand = { $regex: new RegExp(`^${filters.brand}$`, 'i') };
    }

    // 4. Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    // 5. In Stock filter
    if (filters.inStock) {
      query.stock = { $gt: 0 };
    }

    // 6. Keyword search filter
    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    // 7. Sorting
    let sort = { createdAt: -1 };
    if (filters.sort === 'price-low') sort = { price: 1 };
    else if (filters.sort === 'price-high') sort = { price: -1 };
    else if (filters.sort === 'rating') sort = { rating: -1, reviewCount: -1 };
    else if (filters.sort === 'newest') sort = { createdAt: -1 };

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('dealer', 'businessName dealerCode status')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get Product by ID or Slug
   */
  static async getProductByIdOrSlug(idOrSlug) {
    let product;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug).populate('dealer', 'businessName dealerCode phone officialEmail location');
    } else {
      product = await Product.findOne({
        $or: [
          { slug: idOrSlug },
          { sku: idOrSlug.toUpperCase() },
          { slug: new RegExp(`^${idOrSlug}$`, 'i') },
          { slug: new RegExp(`-${idOrSlug}$`, 'i') }
        ]
      }).populate('dealer', 'businessName dealerCode phone officialEmail location');
    }

    if (!product) {
      throw ApiError.notFound('Product not found.');
    }
    return product;
  }

  /**
   * Admin Update Product
   */
  static async adminUpdateProduct(productId, updateData) {
    const product = await Product.findByIdAndUpdate(productId, updateData, { new: true });
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }
    return product;
  }

  /**
   * Admin Delete Product
   */
  static async adminDeleteProduct(productId) {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }
    await Inventory.findOneAndDelete({ product: productId });
    return { message: `Product '${product.name}' permanently deleted by admin.` };
  }
}

