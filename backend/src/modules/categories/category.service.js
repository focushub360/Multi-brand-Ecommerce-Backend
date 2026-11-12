import { Category } from './category.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class CategoryService {
  static async getAllCategories(includeInactive = false) {
    const filter = includeInactive ? {} : { status: 'Active' };
    return await Category.find(filter).sort({ name: 1 }).lean();
  }

  static async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug }).lean();
    if (!category) {
      throw ApiError.notFound(`Category with slug '${slug}' not found.`);
    }
    return category;
  }

  static async createCategory(data) {
    const slug = data.slug || data.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    const existing = await Category.findOne({ $or: [{ name: data.name }, { slug }] });
    if (existing) {
      throw ApiError.conflict(`Category '${data.name}' or slug '${slug}' already exists.`);
    }

    const category = new Category({
      name: data.name.trim(),
      slug,
      description: data.description || '',
      icon: data.icon || 'Package',
      commissionRate: data.commissionRate ?? 5.0,
      subcategories: []
    });

    await category.save();
    return category;
  }

  static async updateCategory(id, data) {
    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    if (data.name) category.name = data.name.trim();
    if (data.description !== undefined) category.description = data.description;
    if (data.icon) category.icon = data.icon;
    if (data.commissionRate !== undefined) category.commissionRate = data.commissionRate;
    if (data.status) category.status = data.status;

    await category.save();
    return category;
  }

  static async deleteCategory(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }
    await Category.findByIdAndDelete(id);
    return { message: `Category '${category.name}' removed successfully.` };
  }

  static async addSubcategory(categoryId, data) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    const slug = data.slug || data.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    const exists = category.subcategories.some((s) => s.slug === slug || s.name.toLowerCase() === data.name.toLowerCase());
    if (exists) {
      throw ApiError.conflict(`Subcategory '${data.name}' already exists in ${category.name}.`);
    }

    category.subcategories.push({
      name: data.name.trim(),
      slug,
      description: data.description || '',
      status: 'Active'
    });

    await category.save();
    return category;
  }
}

