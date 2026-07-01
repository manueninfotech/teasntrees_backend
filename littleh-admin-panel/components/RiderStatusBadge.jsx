export default function RiderStatusBadge({ type, status }) {
    const badges = {
        approval: {
            approved: { label: 'Approved', className: 'bg-bakery-bg text-bakery-primary border border-bakery-light' },
            pending: { label: 'Pending', className: 'bg-orange-50 text-orange-600 border border-orange-100' },
            rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border border-red-100' }
        },
        active: {
            true: { label: 'Active', className: 'bg-bakery-bg text-bakery-primary border border-bakery-light' },
            false: { label: 'Inactive', className: 'bg-gray-50 text-gray-400 border border-gray-100' }
        },
        online: {
            true: { label: 'Online', className: 'bg-bakery-bg text-bakery-primary border border-bakery-light animate-pulse' },
            false: { label: 'Offline', className: 'bg-gray-50 text-gray-400 border border-gray-100' }
        },
        delivery: {
            true: { label: 'On Delivery', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
            false: { label: 'Available', className: 'bg-bakery-bg text-bakery-primary border border-bakery-light' }
        }
    };

    const config = badges[type]?.[status] || badges[type]?.['false'] || { label: status, className: 'bg-gray-50 text-gray-400 border border-gray-100' };

    return (
        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${config.className}`}>
            {config.label}
        </span>
    );
}
