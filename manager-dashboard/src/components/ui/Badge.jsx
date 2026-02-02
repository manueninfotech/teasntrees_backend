import { getStatusBadgeClass } from '../../lib/utils';

export const Badge = ({ status, children, className = '' }) => {
    if (status) {
        return <span className={getStatusBadgeClass(status)}>{children || status}</span>;
    }

    return <span className={className}>{children}</span>;
};
