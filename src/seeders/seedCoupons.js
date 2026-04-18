/**
 * Seeder: Create the "HELLO100" welcome coupon
 * Run: node src/seeders/seedCoupons.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

import Coupon from '../models/Coupon.js';

const MONGO_URI = process.env.MONGO_URI;

const coupons = [
    {
        code: 'HELLO100',
        description: 'Welcome offer — ₹100 off on your first order',
        discountType: 'flat',
        discountAmount: 100,
        maxDiscount: 100,
        minOrderValue: 200,
        brand: null,           // valid for both brands
        usageLimit: null,      // unlimited total uses
        perUserLimit: 1,       // 1 use per customer
        firstOrderOnly: true,  // only on first order
        expiryDate: new Date('2026-12-31T23:59:59Z'),
        isActive: true
    },
    {
        code: 'SAVE10',
        description: '10% off on orders above ₹300 (max ₹150)',
        discountType: 'percentage',
        discountAmount: 10,
        maxDiscount: 150,
        minOrderValue: 300,
        brand: null,
        usageLimit: null,
        perUserLimit: null,
        firstOrderOnly: false,
        expiryDate: new Date('2026-12-31T23:59:59Z'),
        isActive: true
    },
    {
        code: 'LITTLEH50',
        description: '₹50 OFF on LittleH Artisan Bakes',
        discountType: 'flat',
        discountAmount: 50,
        minOrderValue: 400,
        brand: 'littleh',
        usageLimit: null,
        perUserLimit: 1,
        firstOrderOnly: false,
        expiryDate: new Date('2026-12-31T23:59:59Z'),
        isActive: true
    },
    {
        code: 'TEA15',
        description: '15% OFF on Teas N Trees Specialties',
        discountType: 'percentage',
        discountAmount: 15,
        maxDiscount: 100,
        minOrderValue: 200,
        brand: 'teasntrees',
        usageLimit: null,
        perUserLimit: 1,
        firstOrderOnly: false,
        expiryDate: new Date('2026-12-31T23:59:59Z'),
        isActive: true
    },
    {
        code: 'LH10',
        description: '10% OFF on all LittleH items',
        discountType: 'percentage',
        discountAmount: 10,
        maxDiscount: 200,
        minOrderValue: 300,
        brand: 'littleh',
        usageLimit: null,
        perUserLimit: null,
        firstOrderOnly: false,
        expiryDate: new Date('2026-12-31T23:59:59Z'),
        isActive: true
    },
    {
        code: 'TEALOVE',
        description: '₹30 OFF on your favorite Teas',
        discountType: 'flat',
        discountAmount: 30,
        minOrderValue: 150,
        brand: 'teasntrees',
        usageLimit: null,
        perUserLimit: 1,
        firstOrderOnly: false,
        expiryDate: new Date('2026-12-31T23:59:59Z'),
        isActive: true
    }
];

async function seedCoupons() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const data of coupons) {
        const existing = await Coupon.findOne({ code: data.code });
        if (existing) {
            console.log(`Coupon ${data.code} already exists, skipping.`);
            continue;
        }
        await Coupon.create(data);
        console.log(`✅ Created coupon: ${data.code}`);
    }

    await mongoose.disconnect();
    console.log('Done.');
}

seedCoupons().catch(err => {
    console.error('Seeder error:', err);
    process.exit(1);
});
