import React from 'react';

const CustomerStatusBadge = ({ isActive }) => {
    if (isActive) {
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                Active
            </span>
        );
    }

    return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            Inactive
        </span>
    );
};

export default CustomerStatusBadge;
