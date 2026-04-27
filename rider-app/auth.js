const API_BASE = 'https://teasntrees-backend.onrender.com/api/rider/auth';
const ADDRESS_API = 'https://teasntrees-backend.onrender.com/api/customer/address'; // Reusing public geocode route

// Utility for API calls
async function request(url, body, method = 'POST', isFormData = false) {
    const options = {
        method,
        headers: {}
    };

    if (isFormData) {
        options.body = body;
    } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const token = localStorage.getItem('riderToken');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
}

// UI Elements
// Firebase Configuration (Replace with your actual values from Firebase Console)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "tnt-lh.firebaseapp.com",
    projectId: "tnt-lh",
    storageBucket: "tnt-lh.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// UI Elements
const mobileStage = document.getElementById('mobileStage');
const otpStage = document.getElementById('otpStage');
const profileStage = document.getElementById('profileStage');
const pendingStage = document.getElementById('pendingStage');

const mobileInput = document.getElementById('mobileInput');
const otpInput = document.getElementById('otpInput');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const completeProfileBtn = document.getElementById('completeProfileBtn');
const detectLocationBtn = document.getElementById('detectLocationBtn');

let currentMobile = '';
let capturedLocation = null;
let confirmationResult = null;

// Initialize reCAPTCHA
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sendOtpBtn', {
    'size': 'invisible',
    'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
    }
});

// -- AUTH FLOW --

sendOtpBtn.onclick = async () => {
    const mobile = mobileInput.value.trim();
    if (mobile.length !== 10) {
        showError('errorMobile', 'Enter valid 10-digit number');
        return;
    }

    const phoneNumber = `+91${mobile}`;
    const appVerifier = window.recaptchaVerifier;

    try {
        setLoading(sendOtpBtn, true, 'Sending...');
        confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, appVerifier);
        currentMobile = mobile;
        switchStage(otpStage);
    } catch (err) {
        console.error('Firebase Auth Error:', err);
        showError('errorMobile', err.message);
        // Reset reCAPTCHA on error
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.render().then(widgetId => {
                grecaptcha.reset(widgetId);
            });
        }
    } finally {
        setLoading(sendOtpBtn, false, 'Send OTP');
    }
};

verifyOtpBtn.onclick = async () => {
    const otp = otpInput.value.trim();
    if (otp.length !== 6) {
        showError('errorOtp', 'Enter 6-digit OTP');
        return;
    }

    try {
        setLoading(verifyOtpBtn, true, 'Verifying...');

        // 1. Verify OTP with Firebase
        const result = await confirmationResult.confirm(otp);
        const idToken = await result.user.getIdToken();

        // 2. Exchange Firebase ID Token for Backend JWT
        const data = await request(`${API_BASE}/firebase-login`, { idToken });

        localStorage.setItem('riderToken', data.token);
        localStorage.setItem('riderProfile', JSON.stringify(data.user));

        if (!data.user.isProfileComplete) {
            switchStage(profileStage);
        } else if (!data.user.isApproved) {
            switchStage(pendingStage);
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.error('Verification Error:', err);
        showError('errorOtp', err.message);
    } finally {
        setLoading(verifyOtpBtn, false, 'Verify & Login');
    }
};

// -- PROFILE COMPLETION FLOW --

let currentOnboardingStep = 1;
const totalOnboardingSteps = 4;

window.nextStep = () => {
    if (currentOnboardingStep < totalOnboardingSteps) {
        document.getElementById(`step${currentOnboardingStep}`).classList.add('hidden');
        currentOnboardingStep++;
        document.getElementById(`step${currentOnboardingStep}`).classList.remove('hidden');
        updateProgressBar();
    }
};

window.prevStep = () => {
    if (currentOnboardingStep > 1) {
        document.getElementById(`step${currentOnboardingStep}`).classList.add('hidden');
        currentOnboardingStep--;
        document.getElementById(`step${currentOnboardingStep}`).classList.remove('hidden');
        updateProgressBar();
    }
};

function updateProgressBar() {
    const progress = (currentOnboardingStep / totalOnboardingSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('stepIndicator').innerText = `Step ${currentOnboardingStep} of ${totalOnboardingSteps}`;
}

detectLocationBtn.onclick = async (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    try {
        setLoadingValue(detectLocationBtn, true, 'Detecting...');
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            capturedLocation = { lat: latitude, lng: longitude };

            try {
                const res = await fetch(`${ADDRESS_API}/reverse-geocode?lat=${latitude}&lng=${longitude}`);
                const data = await res.json();
                if (data.success && data.data) {
                    document.getElementById('riderAddress').value = data.data.formattedAddress || '';
                    // Populate other fields if possible
                    const d = data.data.details || {};
                    console.log('Geo details:', d);
                }
            } catch (err) {
                console.error('Rev Geo failed', err);
            } finally {
                setLoadingValue(detectLocationBtn, false, 'Detect My Location');
            }
        }, (err) => {
            alert("Failed to get location: " + err.message);
            setLoadingValue(detectLocationBtn, false, 'Detect My Location');
        });
    } catch (err) {
        setLoadingValue(detectLocationBtn, false, 'Detect My Location');
    }
};

document.getElementById('onboardingForm').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    if (capturedLocation) {
        formData.append('location', JSON.stringify(capturedLocation));
    }

    try {
        setLoading(completeProfileBtn, true, 'Submitting...');
        const token = localStorage.getItem('riderToken');

        const response = await fetch(`${API_BASE}/complete-profile`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Submission failed');

        localStorage.setItem('riderProfile', JSON.stringify(data.user));
        switchStage(pendingStage);
    } catch (err) {
        alert(err.message);
    } finally {
        setLoading(completeProfileBtn, false, 'Submit Profile');
    }
};

// -- HELPERS --

function switchStage(stage) {
    [mobileStage, otpStage, profileStage, pendingStage].forEach(s => {
        if (s) s.classList.add('hidden');
    });
    stage.classList.remove('hidden');
    lucide.createIcons();
}

function setLoading(btn, loading, text) {
    btn.disabled = loading;
    btn.innerHTML = loading ? `<span class="animate-spin inline-block">🌀</span> ${text}` : `${text} <i data-lucide="arrow-right"></i>`;
    if (!loading) lucide.createIcons();
}

function setLoadingValue(btn, loading, text) {
    btn.disabled = loading;
    btn.innerHTML = loading ? `<span class="animate-spin inline-block">🌀</span> ${text}` : `<i data-lucide="map-pin" class="w-3 h-3"></i> ${text}`;
    if (!loading) lucide.createIcons();
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = msg;
        el.classList.remove('hidden');
    }
}

document.getElementById('backToMobile').onclick = () => switchStage(mobileStage);

// Utility for token validation
function getValidToken() {
    const token = localStorage.getItem('riderToken');
    if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('riderToken');
        return null;
    }
    return token;
}

// Run on load
function init() {
    const token = getValidToken();
    const profile = JSON.parse(localStorage.getItem('riderProfile') || '{}');

    if (token && profile._id) {
        if (!profile.isProfileComplete) {
            switchStage(profileStage);
        } else if (!profile.isApproved) {
            switchStage(pendingStage);
        } else {
            // Only redirect to dashboard if fully approved
            window.location.href = 'dashboard.html';
        }
    }
    // If no token, we just stay on mobileStage by default
}

init();
