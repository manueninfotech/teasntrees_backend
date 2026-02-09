const API_BASE = 'http://localhost:5000/api/rider';
const token = localStorage.getItem('riderToken');

// Auth Check
function getValidToken() {
    const t = localStorage.getItem('riderToken');
    if (!t || t === 'undefined' || t === 'null') {
        localStorage.removeItem('riderToken');
        return null;
    }
    return t;
}

const vToken = getValidToken();
const isDeliveryPage = document.getElementById('deliveryNumber') !== null;

if (!vToken && isDeliveryPage) {
    window.location.replace('login.html');
}

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${vToken}`
};

// URL Params
const urlParams = new URLSearchParams(window.location.search);
const deliveryId = urlParams.get('id');

if (!deliveryId) {
    window.location.href = 'dashboard.html';
}

// UI Elements
const loader = document.getElementById('loader');
const content = document.getElementById('content');
const actionBar = document.getElementById('actionBar');
const statusBtn = document.getElementById('statusBtn');
const statusBtnText = document.getElementById('statusBtnText');
const otpSection = document.getElementById('otpSection');
const otpInput = document.getElementById('otpInput');

// Data Elements
const deliveryNumber = document.getElementById('deliveryNumber');
const statusBadge = document.getElementById('statusBadge');
const statusTitle = document.getElementById('statusTitle');
const customerName = document.getElementById('customerName');
const deliveryAddress = document.getElementById('deliveryAddress');
const orderItems = document.getElementById('orderItems');
const callBtn = document.getElementById('callBtn');

let delivery = null;
let otpPrompted = false;

// State Machine Mapping
const NEXT_ACTIONS = {
    'assigned': { label: 'Start Pickup Route', next: 'heading_to_pickup', needsOtp: false },
    'accepted': { label: 'Start Pickup Route', next: 'heading_to_pickup', needsOtp: false },
    'heading_to_pickup': { label: 'Arrived at Outlet', next: 'arrived_at_pickup', needsOtp: false },
    'arrived_at_pickup': { label: 'Package Picked Up', next: 'picked_up', needsOtp: true },
    'picked_up': { label: 'Start Delivery Route', next: 'in_transit', needsOtp: false },
    'in_transit': { label: 'Arrived at Customer', next: 'arrived', needsOtp: false },
    'arrived': { label: 'Complete Handover', next: 'delivered', needsOtp: true },
    'delivered': { label: 'Mission Accomplished', next: null, needsOtp: false },
    'cancelled': { label: 'Order Cancelled', next: null, needsOtp: false }
};

async function init() {
    const profile = JSON.parse(localStorage.getItem('riderProfile') || '{}');

    // Preliminary check
    if (profile._id && (!profile.isProfileComplete || !profile.isApproved)) {
        window.location.replace('login.html');
        return;
    }

    await fetchDelivery();
    if (delivery) {
        renderDelivery();
        startLocationTracking();
    }
}

async function fetchDelivery() {
    try {
        const res = await fetch(`${API_BASE}/deliveries/active`, { headers });

        if (res.status === 401) {
            handleLogout();
            return;
        }

        const data = await res.json();
        if (data.success && data.data && data.data._id === deliveryId) {
            delivery = data.data;
        } else {
            alert('Delivery mission inactive or completed');
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

function renderDelivery() {
    loader.classList.add('hidden');
    content.classList.remove('hidden');
    actionBar.classList.remove('hidden');

    const order = delivery.orderId || {};
    deliveryNumber.innerText = `Order #${order.orderNumber || '...'}`;
    statusBadge.innerText = delivery.status.replace(/_/g, ' ');

    renderStatusUI();

    customerName.innerText = delivery.customerId?.name || 'Customer Name';
    deliveryAddress.innerText = order.deliveryAddress?.address || 'Customer Location';

    if (callBtn) {
        callBtn.onclick = () => {
            if (delivery.customerId?.mobile) {
                window.location.href = `tel:${delivery.customerId.mobile}`;
            } else {
                alert("Customer phone number not available");
            }
        };
    }

    orderItems.innerHTML = (order.items || []).map(item => `
        <div class="flex justify-between items-center group">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-800 border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                    ${item.quantity}x
                </div>
                <span class="text-sm font-bold text-slate-700">${item.name || 'Delicious Item'}</span>
            </div>
            <span class="text-sm font-black text-slate-900 tracking-tight">₹${(item.price || 0) * (item.quantity || 1)}</span>
        </div>
    `).join('');

    lucide.createIcons();
}

function renderStatusUI() {
    const action = NEXT_ACTIONS[delivery.status];

    if (!action || !action.next) {
        statusTitle.innerText = delivery.status === 'delivered' ? 'Mission Accomplished!' : 'Delivery Stopped';
        actionBar.classList.add('hidden');
        return;
    }

    statusTitle.innerText = action.label;
    if (statusBtnText) statusBtnText.innerText = action.label;

    if (action.needsOtp && otpPrompted) {
        otpSection.classList.remove('hidden');
        otpInput.focus();
    } else {
        otpSection.classList.add('hidden');
    }
}

statusBtn.onclick = async () => {
    const action = NEXT_ACTIONS[delivery.status];
    if (!action || !action.next) return;

    if (action.needsOtp && !otpPrompted) {
        otpPrompted = true;
        renderStatusUI();
        return;
    }

    const payload = { status: action.next };

    if (action.needsOtp) {
        const otp = otpInput.value.trim();
        if (otp.length !== 4) {
            alert('Please enter a valid 4-digit verification code');
            return;
        }
        payload.otp = otp;
    }

    try {
        statusBtn.disabled = true;
        if (statusBtnText) statusBtnText.innerText = 'Updating Status...';

        const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Update failed');

        delivery = data.data || delivery;
        otpPrompted = false;
        otpInput.value = '';
        renderDelivery();

        if (delivery.status === 'delivered') {
            actionBar.classList.add('hidden');
            statusTitle.innerText = 'Delivery Complete!';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2500);
        }
    } catch (err) {
        alert(err.message);
    } finally {
        statusBtn.disabled = false;
        renderStatusUI();
    }
};

function startLocationTracking() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                await fetch(`${API_BASE}/deliveries/location`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ lat: latitude, lng: longitude })
                });
            } catch (err) {
                console.error('Location sync failed');
            }
        }, null, {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        });
    }
}

init();
