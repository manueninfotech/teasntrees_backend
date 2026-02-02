import { cn } from '../../lib/utils';

export const GlassCard = ({ children, className, hover = false, ...props }) => {
    return (
        <div
            className={cn(
                'glass-card p-6',
                hover && 'hover:-translate-y-1 cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
