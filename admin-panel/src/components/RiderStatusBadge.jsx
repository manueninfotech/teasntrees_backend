export default function RiderStatusBadge({ type, status }) {
    const badges = {
        approval: {
            approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
            pending: { label: 'Pending', className: 'bg-orange-100 text-orange-700' },
            rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' }
        },
        active: {
            true: { label: 'Active', className: 'bg-green-100 text-green-700' },
            false: { label: 'Inactive', className: 'bg-gray-100 text-gray-700' }
        },
        online: {
            true: { label: 'Online', className: 'bg-green-100 text-green-700 animate-pulse' },
            false: { label: 'Offline', className: 'bg-gray-100 text-gray-700' }
        },
        delivery: {
            true: { label: 'On Delivery', className: 'bg-blue-100 text-blue-700' },
            false: { label: 'Available', className: 'bg-green-100 text-green-700' }
        }
    };

    const config = badges[type]?.[status] || badges[type]?.['false'] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.className}`}>
            {config.label}
        </span>
    );
}
