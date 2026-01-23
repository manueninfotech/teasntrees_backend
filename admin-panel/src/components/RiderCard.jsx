import { Bike, Star, Phone, MapPin, Trash2, Power } from 'lucide-react';
import RiderStatusBadge from './RiderStatusBadge';

export default function RiderCard({ rider, onViewDetails, onApprove, onReject, onToggleStatus, onDelete, isPending }) {
    const getVehicleIcon = (type) => {
        return <Bike className="w-4 h-4" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                            <Bike className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{rider.name}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {rider.mobile}
                            </p>
                        </div>
                    </div>
                    {!isPending && (
                        <div className="flex flex-col gap-1 items-end">
                            <RiderStatusBadge type="online" status={rider.isOnline} />
                            <RiderStatusBadge type="active" status={rider.isActive} />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Vehicle Info */}
                <div className="flex items-center gap-2 text-sm">
                    {getVehicleIcon(rider.vehicleType)}
                    <span className="text-gray-600">{rider.vehicleType || 'N/A'}</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-900">{rider.vehicleNumber || 'N/A'}</span>
                </div>

                {/* Stats */}
                {!isPending && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500">Deliveries</p>
                            <p className="font-bold text-gray-900">{rider.totalDeliveries || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Rating</p>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-gray-900">{rider.averageRating?.toFixed(1) || '0.0'}</span>
                                <span className="text-xs text-gray-500">({rider.ratingsCount || 0})</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approval Status for Pending */}
                {isPending && (
                    <div className="pt-3 border-t border-gray-100">
                        <RiderStatusBadge type="approval" status="pending" />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
                {isPending ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onApprove(rider)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => onReject(rider)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                            Reject
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onViewDetails(rider)}
                            className="flex-1 btn-primary text-sm"
                        >
                            View Details
                        </button>
                        <button
                            onClick={() => onToggleStatus(rider)}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            title={rider.isActive ? 'Deactivate' : 'Activate'}
                        >
                            <Power className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(rider)}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
