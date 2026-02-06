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
const isDashboardPage = document.getElementById('riderName') !== null;

if (!vToken && isDashboardPage) {
    window.location.replace('login.html');
}

// Global Headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${vToken}`
};

// UI Elements
const riderNameEl = document.getElementById('riderName');
const availabilityBadge = document.getElementById('availabilityBadge');
const availabilityText = document.getElementById('availabilityText');
const toggleActiveBtn = document.getElementById('toggleActiveBtn');
const toggleBtnText = document.getElementById('toggleBtnText');
const activeOrderSection = document.getElementById('activeOrderSection');
const activeOrderCard = document.getElementById('activeOrderCard');
const requestsList = document.getElementById('requestsList');
const todayEarningsEl = document.getElementById('todayEarnings');
const totalDeliveriesEl = document.getElementById('totalDeliveries');

// Initial State
let riderProfile = JSON.parse(localStorage.getItem('riderProfile') || '{}');
let activeDelivery = null;

// Initialize
async function init() {
    await fetchProfile();

    // Status Check: Only redirect if we HAVE profile data and it says we aren't approved
    if (riderProfile._id) {
        if (!riderProfile.isProfileComplete || !riderProfile.isApproved) {
            console.log('Rider not approved/complete, redirecting to login');
            // Update local storage so login.html knows the updated status immediately
            localStorage.setItem('riderProfile', JSON.stringify(riderProfile));
            window.location.replace('login.html');
            return;
        }
    }

    renderProfile();
    await fetchActiveDelivery();
    initSocket();
    lucide.createIcons();
}

function initSocket() {
    const socket = io('http://localhost:5000', {
        auth: { token: vToken }
    });

    socket.on('delivery:assigned', (data) => {
        showNotification('New Delivery Request!', 'You have a new order waiting for acceptance.');
        fetchActiveDelivery();
    });
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    } else {
        Notification.requestPermission();
    }
    alert(`${title}\n${body}`);
}

async function fetchProfile() {
    try {
        const res = await fetch(`${API_BASE}/auth/profile`, { headers });

        if (res.status === 401) {
            handleLogout();
            return;
        }

        const data = await res.json();
        if (data.success) {
            riderProfile = { ...riderProfile, ...data.data };
            localStorage.setItem('riderProfile', JSON.stringify(riderProfile));
        }
    } catch (err) {
        console.error('Fetch profile error:', err);
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

function renderProfile() {
    riderNameEl.innerText = riderProfile.name || 'Rider';
    todayEarningsEl.innerText = riderProfile.totalEarnings || 0;
    totalDeliveriesEl.innerText = riderProfile.totalDeliveries || 0;
    updateAvailabilityUI(riderProfile.isOnline);
}

function updateAvailabilityUI(isOnline) {
    if (availabilityBadge) {
        availabilityBadge.className = `inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 active-glow animate-pulse' : 'bg-slate-300'}`;
    }
    if (availabilityText) {
        availabilityText.innerText = isOnline ? 'ONLINE & ACTIVE' : 'OFFLINE';
        availabilityText.className = `text-[10px] font-bold ${isOnline ? 'text-emerald-500' : 'text-slate-400'} uppercase tracking-widest`;
    }
    if (toggleBtnText) {
        toggleBtnText.innerText = isOnline ? 'Go Offline' : 'Go Online';
    }
    if (toggleActiveBtn) {
        toggleActiveBtn.className = `w-full py-5 ${isOnline ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'} rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98]`;
    }
    lucide.createIcons();
}

async function fetchActiveDelivery() {
    try {
        const res = await fetch(`${API_BASE}/deliveries/active`, { headers });
        const data = await res.json();

        if (data.success && data.data) {
            activeDelivery = data.data;
            renderActiveOrder();
            requestsList.innerHTML = `
                <div class="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8 text-center">
                    <p class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Focus Mode</p>
                    <p class="text-xs font-bold text-indigo-900">Finish your current delivery to see more requests</p>
                </div>
            `;
        } else {
            activeOrderSection.classList.add('hidden');
            fetchRequests();
        }
    } catch (err) {
        console.error('Fetch active error:', err);
    }
}

async function fetchRequests() {
    requestsList.innerHTML = `
        <div class="bg-white rounded-[2rem] p-10 border border-slate-100 text-center space-y-3">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <i data-lucide="radar" class="w-8 h-8 text-slate-300"></i>
            </div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching for nearby orders...</p>
        </div>
    `;
    lucide.createIcons();
}

function renderActiveOrder() {
    if (!activeDelivery) return;

    activeOrderSection.classList.remove('hidden');
    const order = activeDelivery.orderId || {};

    activeOrderCard.innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div>
                <p class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Incoming Task</p>
                <h3 class="text-2xl font-black uppercase">₹${activeDelivery.totalEarning || 0} Payout</h3>
            </div>
            <div class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                ${activeDelivery.status.replace(/_/g, ' ')}
            </div>
        </div>
        
        <div class="space-y-4 mb-8">
            <div class="flex gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i data-lucide="store" class="w-5 h-5 text-indigo-300"></i>
                </div>
                <div>
                    <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Pickup</p>
                    <p class="text-sm font-bold truncate">Teas N Trees Outlet</p>
                </div>
            </div>
            <div class="flex gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i data-lucide="map-pin" class="w-5 h-5 text-emerald-300"></i>
                </div>
                <div>
                    <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Deliver to</p>
                    <p class="text-sm font-bold truncate">${order.deliveryAddress?.address || 'Customer Location'}</p>
                </div>
            </div>
        </div>

        ${activeDelivery.status === 'assigned' ? `
            <div class="grid grid-cols-2 gap-3">
                <button onclick="handleAction('accept', '${activeDelivery._id}')" class="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all">Accept</button>
                <button onclick="handleAction('reject', '${activeDelivery._id}')" class="py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all">Decline</button>
            </div>
        ` : `
             <button class="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all" onclick="window.location.href='delivery.html?id=${activeDelivery._id}'">
                Open Delivery Card
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
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

init();
