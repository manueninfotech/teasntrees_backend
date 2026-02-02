import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

// Format date
export function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

// Format date with time
export function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return formatDate(date);
}

// Get status badge class
export function getStatusBadgeClass(status) {
    const statusMap = {
        pending: 'badge-pending',
        confirmed: 'badge-confirmed',
        preparing: 'badge-preparing',
        ready: 'badge-confirmed',
        picked_up: 'badge-confirmed',
        'out-for-delivery': 'badge-confirmed',
        delivered: 'badge-delivered',
        cancelled: 'badge-cancelled',
    };

    return statusMap[status] || 'badge-pending';
}

// Get status color
export function getStatusColor(status) {
    const colorMap = {
        pending: 'text-orange-600',
        confirmed: 'text-blue-600',
        preparing: 'text-purple-600',
        ready: 'text-blue-600',
        picked_up: 'text-blue-600',
        'out-for-delivery': 'text-blue-600',
        delivered: 'text-emerald-600',
        cancelled: 'text-red-600',
    };

    return colorMap[status] || 'text-gray-600';
}

// Capitalize first letter
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Truncate text
export function truncate(str, length = 50) {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}
