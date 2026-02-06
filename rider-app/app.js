const API_BASE = 'http://localhost:5000/api/rider';
const token = localStorage.getItem('riderToken');

// Auth Check
const isValidToken = token && token !== 'undefined' && token !== 'null';
const isDashboardPage = document.getElementById('riderName') !== null;

console.log('App Auth Check:', { isValidToken, isDashboardPage });

if (!isValidToken && isDashboardPage) {
    console.log('No valid token on dashboard, replacing with login.html');
    localStorage.removeItem('riderToken');
    window.location.replace('login.html');
}

// Global Headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

// UI Elements
const riderNameEl = document.getElementById('riderName');
const availabilityBadge = document.getElementById('availabilityBadge');
const toggleActiveBtn = document.getElementById('toggleActiveBtn');
const activeOrderSection = document.getElementById('activeOrderSection');
const activeOrderCard = document.getElementById('activeOrderCard');
const requestsList = document.getElementById('requestsList');

// Initial State
let riderProfile = JSON.parse(localStorage.getItem('riderProfile') || '{}');
let activeDelivery = null;

// Initialize
async function init() {
    await fetchProfile(); // Get latest status from server
    renderProfile();
    await fetchActiveDelivery();
    initSocket();
    lucide.createIcons();
}

function initSocket() {
    const socket = io('http://localhost:5000', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Connected to real-time server');
    });

    socket.on('delivery:assigned', (data) => {
        console.log('New delivery assigned:', data);
        // Instant notification
        showNotification('New Delivery Request!', 'You have a new order waiting for acceptance.');
        fetchActiveDelivery(); // Refresh to show the new request
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body });
            }
        });
    }
    // Fallback alert for now
    alert(`${title}\n${body}`);
}

async function fetchProfile() {
    try {
        const res = await fetch(`${API_BASE}/auth/profile`, { headers });
        const data = await res.json();
        if (data.success) {
            riderProfile = { ...riderProfile, ...data.data };
            localStorage.setItem('riderProfile', JSON.stringify(riderProfile));
        }
    } catch (err) {
        console.error('Fetch profile error:', err);
    }
}

function renderProfile() {
    riderNameEl.innerText = `Hi, ${riderProfile.name || 'Rider'}`;
    updateAvailabilityUI(riderProfile.isOnline);
}

function updateAvailabilityUI(isOnline) {
    availabilityBadge.innerText = isOnline ? 'ONLINE' : 'OFFLINE';
    availabilityBadge.className = `badge ${isOnline ? 'badge-active' : 'badge-pending'}`;
    toggleActiveBtn.innerHTML = isOnline
        ? '<i data-lucide="power"></i> GO OFFLINE'
        : '<i data-lucide="zap"></i> GO ONLINE';
    toggleActiveBtn.className = `btn ${isOnline ? 'btn-danger' : 'btn-success'} shadow-xl`;
    lucide.createIcons();
}

// Fetch Active Delivery
async function fetchActiveDelivery() {
    try {
        const res = await fetch(`${API_BASE}/deliveries/active`, { headers });
        const data = await res.json();

        if (data.success && data.data) {
            activeDelivery = data.data;
            renderActiveOrder();
            requestsList.innerHTML = '<p class="text-center text-gray-400 py-4 font-bold uppercase text-[10px]">Finish your current delivery first</p>';
        } else {
            activeOrderSection.classList.add('hidden');
            fetchRequests(); // Only fetch request if NO active order
        }
    } catch (err) {
        console.error('Fetch active error:', err);
    }
}

// Fetch Pending Requests (Mocking the list for now if no list API exists, 
// but wait, does the backend have a /pending or /requests? 
// Looking at deliveryRoutes.js: it only has /active.
// Usually orders are pushed via sockets or retrieved from /active if already assigned.)

// If the system uses "Retry Assignment" or manual assignment, the order 
// will eventually show up in /active if the status is 'assigned'.
// However, if there's a "Requests" pool, we need an endpoint for it.
// Checking backend... productController.js? No. rider/deliveryController.js.

async function fetchRequests() {
    // In this specific system, orders are assigned to riders.
    // If an order is assigned to ME but I haven't accepted it yet, 
    // it normally shows up in a "Requests" list or as a single /active.
    // Let's assume for now that assigned orders needing acceptance 
    // are returned in /active but with a 'pending' or 'assigned' status.

    // If the backend doesn't have a "List of requests" yet, 
    // /active is the primary way to get the current task.

    // UPDATE: Based on my previous implementation in riderAssignmentService 
    // and rider/deliveryController, an order is assigned to a rider 
    // and the rider gets a notification.

    requestsList.innerHTML = '<p class="text-center text-gray-400 py-12 font-bold uppercase tracking-widest text-[10px]">No new requests at the moment</p>';
}

function renderActiveOrder() {
    if (!activeDelivery) return;

    activeOrderSection.classList.remove('hidden');
    const order = activeDelivery.orderId; // Standard population

    activeOrderCard.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <span class="text-[10px] font-black uppercase text-indigo-600 tracking-tighter">Order #${order.orderNumber || '...'}</span>
                <h3 class="text-lg font-black uppercase text-gray-900 mt-1">₹${activeDelivery.totalEarning} Earning</h3>
            </div>
            <div class="badge badge-active">${activeDelivery.status.replace(/_/g, ' ')}</div>
        </div>
        
        <div class="space-y-3 mb-6">
            <div class="flex gap-3">
                <i data-lucide="map-pin" class="w-4 h-4 text-gray-400"></i>
                <div>
                    <p class="text-[10px] font-black uppercase text-gray-400">Pickup</p>
                    <p class="text-xs font-bold truncate">Teas N Trees Outlet</p>
                </div>
            </div>
            <div class="flex gap-3">
                <i data-lucide="navigation" class="w-4 h-4 text-gray-400"></i>
                <div>
                    <p class="text-[10px] font-black uppercase text-gray-400">Delivery to</p>
                    <p class="text-xs font-bold">${order.deliveryAddress?.address || 'Customer Location'}</p>
                </div>
            </div>
        </div>

        ${activeDelivery.status === 'assigned' ? `
            <div class="flex gap-2">
                <button onclick="handleAction('accept', '${activeDelivery._id}')" class="btn btn-success flex-1">Accept</button>
                <button onclick="handleAction('reject', '${activeDelivery._id}')" class="btn bg-gray-200 text-gray-600 flex-1">Reject</button>
            </div>
        ` : `
             <button class="btn btn-primary" onclick="window.location.href='delivery.html?id=${activeDelivery._id}'">
                View Task Details
                <i data-lucide="arrow-right"></i>
             </button>
        `}
    `;
    lucide.createIcons();
}

// Action Handlers
window.handleAction = async (action, id) => {
    try {
        const event = action === 'accept' ? 'accept' : 'reject';
        const res = await fetch(`${API_BASE}/deliveries/${id}/${event}`, {
            method: 'POST',
            headers
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        alert(`Delivery ${event}ed successfully!`);
        location.reload();
    } catch (err) {
        alert(err.message);
    }
};

// Toggle Availability
toggleActiveBtn.onclick = async () => {
    try {
        toggleActiveBtn.disabled = true;
        const nextStatus = !riderProfile.isOnline;

        const res = await fetch(`${API_BASE}/auth/availability`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ isOnline: nextStatus })
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        riderProfile.isOnline = data.data.isOnline;
        localStorage.setItem('riderProfile', JSON.stringify(riderProfile));
        updateAvailabilityUI(riderProfile.isOnline);
    } catch (err) {
        alert(err.message);
    } finally {
        toggleActiveBtn.disabled = false;
    }
};

// Logout
document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};

// Start
init();
