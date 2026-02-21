import Contact from '../../models/Contact.js';

// @desc    Get all contact messages
// @route   GET /api/v1/admin/contact
// @access  Private/Admin
export const getAllMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const brand = req.query.brand;

        let query = {};
        if (status) {
            query.status = status;
        }
        if (brand) {
            query.brand = brand;
        }

        const messages = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Contact.countDocuments(query);

        res.status(200).json({
            success: true,
            count: messages.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update message status
// @route   PATCH /api/v1/admin/contact/:id/status
// @access  Private/Admin
export const updateMessageStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete message
// @route   DELETE /api/v1/admin/contact/:id
// @access  Private/Admin
export const deleteMessage = async (req, res) => {
    try {
        const message = await Contact.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
