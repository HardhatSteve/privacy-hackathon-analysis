"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Globe, Shield, Settings, Zap } from 'lucide-react';

export type TabValue = 'dashboard' | 'network' | 'shield' | 'tactical' | 'settings';

interface TabItem {
    value: TabValue;
    label: string;
    icon: React.ReactNode;
}

export const TABS: TabItem[] = [
    { value: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { value: 'network', label: 'Network', icon: <Globe className="w-4 h-4" /> },
    { value: 'shield', label: 'Shield', icon: <Shield className="w-4 h-4" /> },
    { value: 'tactical', label: 'Tactical', icon: <Zap className="w-4 h-4" /> },
    { value: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

interface TabNavigationProps {
    activeTab: TabValue;
    onChange: (tab: TabValue) => void;
}

export const TabNavigation = ({ activeTab, onChange }: TabNavigationProps) => {
    return (
        <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/5">
            {TABS.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => onChange(tab.value)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === tab.value
                        ? 'text-tactical-cyan'
                        : 'text-white/40 hover:text-white/60'
                        }`}
                >
                    {activeTab === tab.value && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-tactical-cyan/10 rounded-lg border border-tactical-cyan/20"
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        />
                    )}
                    <span className="relative z-10">{tab.icon}</span>
                    <span className="relative z-10 hidden sm:block">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

// Mobile Bottom Navigation
export const MobileNavigation = ({ activeTab, onChange }: TabNavigationProps) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="bg-black/90 backdrop-blur-xl border-t border-white/5 safe-bottom">
                <div className="flex items-center justify-around py-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onChange(tab.value)}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${activeTab === tab.value
                                ? 'text-tactical-cyan'
                                : 'text-white/30'
                                }`}
                        >
                            <span className={activeTab === tab.value ? 'scale-110' : ''}>
                                {tab.icon}
                            </span>
                            <span className="text-[10px] font-medium">{tab.label}</span>
                            {activeTab === tab.value && (
                                <motion.div
                                    layoutId="mobileActiveTab"
                                    className="absolute bottom-0 w-12 h-0.5 bg-tactical-cyan rounded-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};
