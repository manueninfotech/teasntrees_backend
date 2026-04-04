import Category from "../../models/Category.js";
import { SOCKET_EVENTS } from "../../sockets/socketEvents.js";
import activityLogService from '../../services/activityLogService.js';
import { clearProductCache } from '../customer/productController.js';
import { clearCategoryCache } from '../customer/categoryController.js';

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'displayOrder';
        const order = req.query.order === 'desc' ? -1 : 1;
        const skip = (page - 1) * limit;

        let filter = {};
        if (req.activeBrand) {
            filter.brand = req.activeBrand;
        }

        const categories = await Category.find(filter)
            .sort({ [sortBy]: order })
            .limit(limit)
            .skip(skip);
        const total = await Category.countDocuments(filter);
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit: limit,
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.activeBrand) filter.brand = req.activeBrand;
        const category = await Category.findOne(filter);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// create new category
export const createCategory = async (req, res) => {
    try {
        const { name, description, icon, displayOrder } = req.body;
        const activeBrand = req.activeBrand || 'teasntrees';
        // check if category already exists
        const existingCategory = await Category.findOne({ name, brand: activeBrand });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }
        const category = await Category.create({
            name,
            description,
            icon,
            displayOrder,
            brand: activeBrand
        });

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            const socketData = {
                categoryId: category._id,
                name: category.name,
                icon: category.icon
            };
            // Broadcast to everyone
            io.emit(SOCKET_EVENTS.CATEGORY_CREATED, socketData);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'create',
            resource: 'category',
            resourceId: category._id,
            details: { name: category.name }
        });

        // Invalidate customer caches
        clearProductCache();
        clearCategoryCache();

        res.status(200).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// update category
export const updateCategory = async (req, res) => {
    try {
        const { name, description, icon, displayOrder } = req.body;
        const activeBrand = req.activeBrand || 'teasntrees';
        const category = await Category.findOne({ _id: req.params.id, brand: activeBrand });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        // check if name is being changed and if it already exists
        if (name && name != category.name) {
            const existingCategory = await Category.findOne({ name, brand: activeBrand });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists'
                });
            }
        }
        category.name = name || category.name;
        category.description = description || category.description;
        category.icon = icon || category.icon;
        category.displayOrder = displayOrder !== undefined ? displayOrder : category.displayOrder;
        category.brand = activeBrand;

        await category.save();

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            const socketData = {
                categoryId: category._id,
                name: category.name,
                icon: category.icon
            };
            io.emit(SOCKET_EVENTS.CATEGORY_UPDATED, socketData);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'update',
            resource: 'category',
            resourceId: category._id,
            details: { name: category.name }
        });

        // Invalidate customer caches
        clearProductCache();
        clearCategoryCache();

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.activeBrand) filter.brand = req.activeBrand;
        const category = await Category.findOne(filter);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const categoryData = { id: category._id, name: category.name };
        await category.deleteOne();

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            io.emit(SOCKET_EVENTS.CATEGORY_DELETED, categoryData);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'delete',
            resource: 'category',
            resourceId: categoryData.id,
            details: { name: categoryData.name }
        });

        // Invalidate customer caches
        clearProductCache();
        clearCategoryCache();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};
