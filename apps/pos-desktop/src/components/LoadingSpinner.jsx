import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="relative w-24 h-24 mx-auto">
                    {/* Spinner animation */}
                    <div className="absolute top-0 left-0 w-full h-full border-8 border-blue-200 rounded-full animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-8 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-lg font-semibold text-gray-700 animate-pulse">
                    Yuklanmoqda...
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
