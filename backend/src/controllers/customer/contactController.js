import Contact from '../../models/Contact.js';

// @desc    Submit contact form
// @route   POST /api/v1/contact
// @access  Public
export const submitContactForm = async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;

        const newContact = await Contact.create({
            firstName,
            lastName,
            brand: req.activeBrand || 'teasntrees',
            email,
            subject,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newContact
        });
    } catch (error) {
        console.error('Submit contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
