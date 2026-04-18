import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Rider from '../models/Rider.js';

dotenv.config();

const seedRider = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const riderData = {
            name: 'Test Rider',
            mobile: '9876543210',
            email: 'rider@test.com',
            role: 'rider',
            isApproved: true,
            isActive: true,
            vehicleType: 'bike',
            vehicleNumber: 'KA-01-AB-1234',
            vehicleModel: 'Splendor Plus',
            licenseNumber: 'DL1234567890',
            licenseExpiryDate: new Date('2030-01-01'),
            licensePhoto: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            aadharNumber: '123412341234',
            aadharPhoto: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            panNumber: 'ABCDE1234F',
            panPhoto: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            bankAccountNumber: '987654321012',
            ifscCode: 'SBIN0001234',
            accountHolderName: 'Test Rider',
            emergencyContact: {
                name: 'Emergency Contact',
                mobile: '9999999999',
                relation: 'Father'
            },
            currentLocation: {
                type: 'Point',
                coordinates: [77.5946, 12.9716] // Bangalore
            }
        };

        const existingRider = await Rider.findOne({ mobile: riderData.mobile });
        if (existingRider) {
            console.log('Test Rider already exists');
            // Ensure approved
            existingRider.isApproved = true;
            await existingRider.save();
        } else {
            await Rider.create(riderData);
            console.log('Test Rider Created');
        }

        process.exit(0);
    } catch (error) {
        console.error('Seeder Failed:', error);
        process.exit(1);
    }
};

seedRider();
