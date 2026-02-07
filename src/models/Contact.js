import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        enum: ['General Inquiry', 'Reservation', 'Event Booking', 'Feedback', 'Support', 'Other']
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    },
    status: {
        type: String,
        enum: ['New', 'Read', 'Resolved'],
        default: 'New'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Contact', contactSchema);
