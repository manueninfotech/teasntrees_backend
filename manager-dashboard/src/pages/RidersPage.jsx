import { GlassCard } from '../components/ui/GlassCard';

export const RidersPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Riders Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Approve and manage delivery riders
                </p>
            </div>

            <GlassCard>
                <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                    Riders page coming soon...
                </p>
            </GlassCard>
        </div>
    );
};
