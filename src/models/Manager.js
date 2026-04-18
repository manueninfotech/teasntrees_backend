import mongoose from 'mongoose';
import User from './User.js';

const managerSchema = new mongoose.Schema({
    // Manager specific fields
    assignedBranch: {
        type: String,
        trim: true,
        default: 'Main'
    },

    shifts: [{
        day: String,
        startTime: String,
        endTime: String
    }],
    // Performance/Operational stats
    ordersHandled: { type: Number, default: 0 },
    ridersManaged: { type: Number, default: 0 }

}, {
    discriminatorKey: 'kind'
});

const Manager = User.discriminator('Manager', managerSchema);

export default Manager;
