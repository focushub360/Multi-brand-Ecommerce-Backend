import { CategoryService } from './category.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAllCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === 'true';
  const categories = await CategoryService.getAllCategories(includeInactive);
  return res.status(200).json(ApiResponse.success(categories, 'Categories retrieved successfully'));
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await CategoryService.getCategoryBySlug(req.params.slug);
  return res.status(200).json(ApiResponse.success(category, 'Category details retrieved successfully'));
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.createCategory(req.body);
  return res.status(201).json(ApiResponse.created(category, 'Category created successfully'));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.updateCategory(req.params.id, req.body);
  return res.status(200).json(ApiResponse.success(category, 'Category updated successfully'));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await CategoryService.deleteCategory(req.params.id);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const addSubcategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.addSubcategory(req.params.id, req.body);
  return res.status(201).json(ApiResponse.created(category, 'Subcategory added successfully'));
});

