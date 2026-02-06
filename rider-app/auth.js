const API_BASE = 'http://localhost:5000/api/rider/auth';

// Utility for API calls
async function request(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
}

// UI Elements
const mobileStage = document.getElementById('mobileStage');
const otpStage = document.getElementById('otpStage');
const mobileInput = document.getElementById('mobileInput');
const otpInput = document.getElementById('otpInput');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const errorMobile = document.getElementById('errorMobile');
const errorOtp = document.getElementById('errorOtp');
const backToMobile = document.getElementById('backToMobile');

let currentMobile = '';

// Send OTP Handler
sendOtpBtn.onclick = async () => {
    const mobile = mobileInput.value.trim();
    if (mobile.length !== 10) {
        showError(errorMobile, 'Enter valid 10-digit number');
        return;
    }

    try {
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<span class="animate-spin">🌀</span> Sending...';

        await request(`${API_BASE}/send-otp`, { mobile });

        currentMobile = mobile;
        mobileStage.classList.add('hidden');
        otpStage.classList.remove('hidden');
        hideError(errorMobile);
    } catch (err) {
        showError(errorMobile, err.message);
    } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = 'Send OTP <i data-lucide="arrow-right"></i>';
        lucide.createIcons();
    }
};

// Verify OTP Handler
verifyOtpBtn.onclick = async () => {
    const otp = otpInput.value.trim();
    if (otp.length !== 6) {
        showError(errorOtp, 'Enter 6-digit OTP');
        return;
    }

    try {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<span class="animate-spin">🌀</span> Verifying...';

        const data = await request(`${API_BASE}/verify-otp`, { mobile: currentMobile, otp });

        // Save Token and redirect
        localStorage.setItem('riderToken', data.token);
        localStorage.setItem('riderProfile', JSON.stringify(data.rider));

        window.location.href = 'dashboard.html';
    } catch (err) {
        showError(errorOtp, err.message);
    } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = 'Verify & Login <i data-lucide="check-circle-2"></i>';
        lucide.createIcons();
    }
};

// Back button
backToMobile.onclick = () => {
    otpStage.classList.add('hidden');
    mobileStage.classList.remove('hidden');
};

function showError(el, msg) {
    el.innerText = msg;
    el.classList.remove('hidden');
}

function hideError(el) {
    el.classList.add('hidden');
}

// Auto-redirect if already logged in
// Auto-redirect if already logged in
function checkAuthAndRedirect() {
    try {
        const token = localStorage.getItem('riderToken');
        const isValid = token && token !== 'undefined' && token !== 'null';
        const isLoginPage = document.getElementById('loginCard') !== null;

        console.log('Auth check on Login Page:', { isValid, isLoginPage });

        if (isValid && isLoginPage) {
            console.log('Token found, moving to dashboard...');
            window.location.replace('dashboard.html');
        }
    } catch (err) {
        console.error('Auth redirect error:', err);
    }
}

// Run immediately
checkAuthAndRedirect();
