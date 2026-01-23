import React from 'react';
import { X, Info, Terminal, Globe, Monitor, Shield, Calendar, User } from 'lucide-react';

const LogDetailsModal = ({ log, isOpen, onClose }) => {
    if (!isOpen || !log) return null;

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'create': return 'text-green-600 bg-green-100';
            case 'update': return 'text-blue-600 bg-blue-100';
            case 'delete': return 'text-red-600 bg-red-100';
            case 'login': return 'text-indigo-600 bg-indigo-100';
            case 'activate': return 'text-emerald-600 bg-emerald-100';
            case 'deactivate': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-100">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Activity Log Details</h2>
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Log ID: {log._id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Admin
                            </p>
                            <p className="font-bold text-gray-900">{log.admin?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 truncate">{log.admin?.email}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Timestamp
                            </p>
                            <p className="font-bold text-gray-900">{formatDate(log.createdAt)}</p>
                        </div>
                    </div>

                    {/* Action & Resource */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Action Type</label>
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold capitalize ${getActionColor(log.action)}`}>
                                {log.action}
                            </span>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Resource Affected</label>
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-bold capitalize">
                                <Shield className="w-4 h-4 text-gray-400" />
                                {log.resource}
                            </span>
                        </div>
                    </div>

                    {/* Details / Payload */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" /> Action Details (Payload)
                            </label>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto max-h-60 shadow-inner">
                            <pre className="text-xs font-mono text-indigo-300">
                                {JSON.stringify(log.details, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Technical Meta */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" /> IP Address
                            </p>
                            <p className="text-sm font-medium text-gray-700 font-mono">{log.ipAddress || '127.0.0.1'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Monitor className="w-3.5 h-3.5" /> User Agent
                            </p>
                            <p className="text-sm font-medium text-gray-700 truncate" title={log.userAgent}>{log.userAgent || 'Chrome / Windows'}</p>
                        </div>
                    </div>

                    {/* Error Handling (If failed) */}
                    {!log.success && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Error Message</p>
                            <p className="text-sm text-red-700 font-medium">{log.errorMessage || 'Operation failed'}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogDetailsModal;
