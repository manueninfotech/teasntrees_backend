import React, { useState } from 'react';
import { Settings as SettingsIcon, Map, LayoutGrid } from 'lucide-react';
import GeneralSettings from '../components/settings/GeneralSettings';
import ServiceAreas from '../components/settings/ServiceAreas';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General Settings', icon: LayoutGrid },
        { id: 'zones', label: 'Service Areas', icon: Map },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="w-8 h-8 text-green-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    <p className="text-sm text-gray-500">Manage store configuration and delivery zones</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-2 flex items-center gap-2 transition-colors relative ${activeTab === tab.id
                                        ? 'text-green-600 font-medium'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'general' ? <GeneralSettings /> : <ServiceAreas />}
            </div>
        </div>
    );
};

export default Settings;
