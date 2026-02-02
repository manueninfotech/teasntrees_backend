import { cn } from '../../lib/utils';

export const Input = ({ label, error, className, ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    'w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600',
                    'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
                    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'text-gray-900 dark:text-white',
                    'transition-all duration-200',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
};
