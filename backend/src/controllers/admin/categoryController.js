import Category from "../../models/Category.js";

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'displayOrder';
        const order = req.query.order === 'desc' ? -1 : 1;
        const skip = (page - 1) * limit;

        const categories = await Category.find()
            .sort({ [sortBy]: order })
            .limit(limit)
            .skip(skip);
        const total = await Category.countDocuments();
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
        const category = await Category.findById(req.params.id);
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
        // check if category already exists
        const existingCategory = await Category.findOne({ name });
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
            displayOrder
        });

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('manager', 'category:created', {
                categoryId: category._id,
                name: category.name,
                icon: category.icon
            });
            socketService.notifyRole('admin', 'category:created', {
                categoryId: category._id,
                name: category.name,
                icon: category.icon
            });
        }

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
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        // check if name is being changed and if it already exists
        if (name && name != category.name) {
            const existingCategory = await Category.findOne({ name });
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

        await category.save();

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('manager', 'category:updated', {
                categoryId: category._id,
                name: category.name,
                icon: category.icon
            });
            socketService.notifyRole('admin', 'category:updated', {
                categoryId: category._id,
                name: category.name,
                icon: category.icon
            });
        }

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
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const categoryData = { id: category._id, name: category.name };
        await category.deleteOne();

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('manager', 'category:deleted', categoryData);
            socketService.notifyRole('admin', 'category:deleted', categoryData);
        }

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