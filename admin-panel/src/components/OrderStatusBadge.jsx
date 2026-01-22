export default function OrderStatusBadge({ status }) {
    const statusConfig = {
        pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
        confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
        preparing: { label: 'Preparing', className: 'bg-orange-100 text-orange-700' },
        ready: { label: 'Ready', className: 'bg-purple-100 text-purple-700' },
        assigned: { label: 'Assigned', className: 'bg-cyan-100 text-cyan-700' },
        picked_up: { label: 'Picked Up', className: 'bg-indigo-100 text-indigo-700' },
        'out-for-delivery': { label: 'Out for Delivery', className: 'bg-yellow-100 text-yellow-700' },
        in_transit: { label: 'In Transit', className: 'bg-yellow-100 text-yellow-700' },
        delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
        cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
            {config.label}
        </span>
    );
}
