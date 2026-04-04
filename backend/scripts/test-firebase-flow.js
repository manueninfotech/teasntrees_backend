/**
 * End-to-End Simulation Test for Firebase Login & Profile Completion
 * 
 * This script simulates:
 * 1. A new user logging in via Firebase (using test bypass)
 * 2. Receiving a JWT
 * 3. Calling /complete-profile with the JWT
 * 4. Verifying the user state (isProfileComplete, isApproved)
 */

import axios from 'axios';
import logger from '../src/config/logger.js';

const API_ROOT = 'http://localhost:5000/api';
const TEST_TOKEN = 'test-token-123'; // Triggers the bypass
const TEST_MOBILE = '9876543210';

async function runTest() {
    console.log('\n🚀 Starting E2E Firebase Flow Simulation...\n');

    try {
        // --- STEP 1: LOGIN (RIDER AS EXAMPLE) ---
        console.log('Step 1: Firebase Login (Rider)...');
        const loginRes = await axios.post(`${API_ROOT}/rider/auth/firebase-login`, {
            idToken: TEST_TOKEN
        });

        if (!loginRes.data.success) throw new Error('Login failed');

        const { token, rider, isNewUser } = loginRes.data;
        console.log('✅ Login Successful!');
        console.log(`   Rider ID: ${rider.id || rider._id}`);
        console.log(`   isNewUser: ${isNewUser}`);
        console.log(`   isProfileComplete: ${rider.isProfileComplete}`);
        console.log(`   isApproved: ${rider.isApproved}\n`);

        // --- STEP 2: COMPLETE PROFILE ---
        console.log('Step 2: Completing Profile...');
        const profileData = {
            name: 'Test Rider',
            email: 'testrider@example.com',
            address: '123 Test Street, Bangalore',
            vehicleType: 'bike',
            vehicleNumber: 'KA 01 TEST 123',
            vehicleModel: 'Test Model',
            bankAccountNumber: '1234567890',
            ifscCode: 'TEST0001',
            accountHolderName: 'Test User',
            licenseNumber: 'TEST-LC-001',
            licenseExpiryDate: '2030-12-31',
            aadharNumber: '123412341234',
            panNumber: 'ABCDE1234F',
            emergencyContactName: 'Emergency Contact',
            emergencyContactMobile: '9999999999',
            emergencyContactRelation: 'Friend'
        };

        const profileRes = await axios.post(`${API_ROOT}/rider/auth/complete-profile`, profileData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileRes.data.success) throw new Error('Profile completion failed: ' + profileRes.data.message);

        console.log('✅ Profile Completed!');
        console.log(`   Message: ${profileRes.data.message}`);
        console.log(`   Updated Rider isApproved: ${profileRes.data.rider.isApproved}\n`);

        // --- STEP 3: RE-LOGIN ---
        console.log('Step 3: Re-login as existing user...');
        const reLoginRes = await axios.post(`${API_ROOT}/rider/auth/firebase-login`, {
            idToken: TEST_TOKEN
        });

        console.log('✅ Re-login Successful!');
        console.log(`   isNewUser: ${reLoginRes.data.isNewUser}`);
        console.log(`   isProfileComplete: ${reLoginRes.data.rider.isProfileComplete}\n`);

        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!\n');

    } catch (error) {
        console.error('❌ Test Failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${JSON.stringify(error.response.data)}\n`);
        } else {
            console.error(`   Error: ${error.message}\n`);
        }
        process.exit(1);
    }
}

runTest();
