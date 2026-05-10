/**
 * Loading Overlay Component
 * Fullscreen transition screen shown when switching between Surface and Underground views.
 */

import React from 'react';

interface LoadingOverlayProps {
    message: string;
    isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 transition-opacity duration-300">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        animation: 'grid-scroll 2s linear infinite'
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative flex flex-col items-center gap-6">
                {/* Spinner */}
                <div className="relative w-20 h-20">
                    {/* Outer Ring */}
                    <div
                        className="absolute inset-0 border-4 border-slate-700 rounded-full"
                        style={{ borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }}
                    />
                    {/* Inner Ring */}
                    <div
                        className="absolute inset-2 border-4 border-slate-800 rounded-full"
                        style={{ borderBottomColor: '#22c55e', animation: 'spin 0.75s linear infinite reverse' }}
                    />
                    {/* Center Dot */}
                    <div className="absolute inset-6 bg-amber-500 rounded-full animate-pulse" />
                </div>

                {/* Message */}
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white font-['Rajdhani'] tracking-wider uppercase mb-2">
                        {message}
                    </h2>
                    <div className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>

                {/* Subtitle */}
                <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
                    Initializing Systems...
                </p>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes grid-scroll {
                    from { transform: translateY(0); }
                    to { transform: translateY(40px); }
                }
            `}</style>
        </div>
    );
};
