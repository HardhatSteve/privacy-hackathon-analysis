"use client";

import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
    <div className={`skeleton ${className}`} />
);

export const SkeletonText = ({ className = '', lines = 1 }: SkeletonProps & { lines?: number }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className="skeleton-text"
                style={{ width: i === lines - 1 ? '75%' : '100%' }}
            />
        ))}
    </div>
);

export const SkeletonCard = () => (
    <div className="tactical-glass p-6 space-y-4">
        <div className="flex items-center gap-3">
            <div className="skeleton-circle w-8 h-8" />
            <div className="flex-1">
                <div className="skeleton-text w-24 mb-1" />
                <div className="skeleton-text w-16 h-3" />
            </div>
        </div>
        <SkeletonText lines={3} />
    </div>
);

export const SkeletonRadar = () => (
    <div className="tactical-glass p-6 flex flex-col items-center">
        <div className="skeleton-circle w-32 h-32 mb-4" />
        <div className="skeleton-text w-20 mb-2" />
        <div className="skeleton-text w-16 h-3" />
    </div>
);

export const SkeletonFeed = () => (
    <div className="tactical-glass p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="skeleton-circle w-5 h-5" />
                <div className="skeleton-text w-32" />
            </div>
            <div className="skeleton w-20 h-6 rounded" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-white/5 rounded-lg space-y-3">
                <div className="flex justify-between">
                    <div className="skeleton-text w-24" />
                    <div className="skeleton w-16 h-5 rounded" />
                </div>
                <div className="skeleton-text w-full h-3" />
                <div className="skeleton-text w-3/4 h-3" />
            </div>
        ))}
    </div>
);

export const SkeletonStats = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card">
                <div className="skeleton-circle w-6 h-6 mx-auto mb-2" />
                <div className="skeleton-text w-12 mx-auto mb-1" />
                <div className="skeleton-text w-8 h-6 mx-auto" />
            </div>
        ))}
    </div>
);
