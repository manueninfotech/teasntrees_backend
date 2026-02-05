const API_BASE = 'http://localhost:5000/api/rider';
const token = localStorage.getItem('riderToken');

if (!token) {
    window.location.href = 'login.html';
}

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

// URL Params
const urlParams = new URLSearchParams(window.location.search);
const deliveryId = urlParams.get('id');

if (!deliveryId) {
    window.location.href = 'index.html';
}

// UI Elements
const loader = document.getElementById('loader');
const content = document.getElementById('content');
const actionBar = document.getElementById('actionBar');
const statusBtn = document.getElementById('statusBtn');
const otpSection = document.getElementById('otpSection');
const otpInput = document.getElementById('otpInput');

// Data Elements
const deliveryNumber = document.getElementById('deliveryNumber');
const statusBadge = document.getElementById('statusBadge');
const statusTitle = document.getElementById('statusTitle');
const customerName = document.getElementById('customerName');
const customerPhone = document.getElementById('customerPhone');
const deliveryAddress = document.getElementById('deliveryAddress');
const orderItems = document.getElementById('orderItems');

let delivery = null;
let otpPrompted = false;

// State Machine Mapping
const NEXT_ACTIONS = {
    'assigned': { label: 'Start Pickup', next: 'heading_to_pickup', needsOtp: false },
    'heading_to_pickup': { label: 'I Have Arrived at Outlet', next: 'arrived_at_pickup', needsOtp: false },
    'arrived_at_pickup': { label: 'Complete Pickup', next: 'picked_up', needsOtp: true },
    'picked_up': { label: 'Start Delivery', next: 'in_transit', needsOtp: false },
    'in_transit': { label: 'I Have Arrived at Customer', next: 'arrived', needsOtp: false },
    'arrived': { label: 'Complete Delivery', next: 'delivered', needsOtp: true },
    'delivered': { label: 'Delivery Completed', next: null, needsOtp: false },
    'cancelled': { label: 'Order Cancelled', next: null, needsOtp: false }
};

async function init() {
    await fetchDelivery();
    if (delivery) {
        renderDelivery();
        startLocationTracking();
    }
}

async function fetchDelivery() {
    try {
        const res = await fetch(`${API_BASE}/deliveries/active`, { headers });
        const data = await res.json();

        // Find the specific delivery from active or just fetch by ID if backend supports it
        // For now, let's assume /active returns the current one.
        if (data.success && data.data && data.data._id === deliveryId) {
            delivery = data.data;
        } else {
            // Fallback: If not in active (e.g. just completed), we might need a GET /deliveries/:id
            // Checking if such route exists... backend/src/routes/rider/deliveryRoutes.js: no specific GET /:id
            // Let's check if getActiveDelivery can filter or if we need a new route.
            // Actually, if it's already delivered, it won't be in /active.
            alert('Delivery not found or already completed');
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

function renderDelivery() {
    loader.classList.add('hidden');
    content.classList.remove('hidden');
    actionBar.classList.remove('hidden');

    const order = delivery.orderId;
    deliveryNumber.innerText = `Order #${order.orderNumber || '...'}`;
    statusBadge.innerText = delivery.status.replace(/_/g, ' ');

    // Status Display
    renderStatusUI();

    // Customer Info
    customerName.innerText = delivery.customerId?.name || 'Customer';
    customerPhone.innerText = delivery.customerId?.mobile || '';
    deliveryAddress.innerText = order.deliveryAddress?.address || 'N/A';

    // Items
    orderItems.innerHTML = (order.items || []).map(item => `
        <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
                <span class="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg text-[10px] font-black">${item.quantity}x</span>
                <span class="text-sm font-bold text-gray-700">${item.name || 'Item'}</span>
            </div>
            <span class="text-sm font-black text-gray-900">₹${item.price * item.quantity}</span>
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
    statusBtn.innerText = action.label;

    if (action.needsOtp && otpPrompted) {
        otpSection.classList.remove('hidden');
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
        otpInput.focus();
        return;
    }

    const payload = { status: action.next };

    if (action.needsOtp) {
        const otp = otpInput.value.trim();
        if (otp.length !== 4) {
            alert('Please enter a valid 4-digit OTP');
            return;
        }
        payload.otp = otp;
    }

    try {
        statusBtn.disabled = true;
        statusBtn.innerText = 'Updating...';

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
            statusTitle.innerText = 'Mission Accomplished!';
        }
    } catch (err) {
        alert(err.message);
    } finally {
        statusBtn.disabled = false;
        renderStatusUI();
    }
};

// Simple Location Tracking
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
                console.error('Location sync error:', err);
            }
        }, (err) => {
            console.error('Geolocation error:', err);
        }, {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        });
    }
}

init();
