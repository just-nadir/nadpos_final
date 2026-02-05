import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log xatoni backend ga yuborish
        console.error('Error Boundary caught:', error, errorInfo);

        // Electron API orqali log faylga yozish
        if (window.api?.logError) {
            window.api.logError(error.toString(), errorInfo.componentStack);
        }

        this.setState({
            error,
            errorInfo
        });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.hash = '/';
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
                        <div className="text-center">
                            {/* Icon */}
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                                <AlertTriangle className="w-10 h-10 text-red-600" />
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                Nimadur xato ketdi
                            </h1>

                            {/* Description */}
                            <p className="text-gray-600 mb-8 text-lg">
                                Ilova kutilmagan xatolikka duch keldi. Iltimos, sahifani yangilang yoki asosiy sahifaga qayting.
                            </p>

                            {/* Error Details (Development) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mb-8 p-4 bg-gray-50 rounded-lg text-left">
                                    <h3 className="font-semibold text-gray-900 mb-2">Xatolik Tafsilotlari:</h3>
                                    <pre className="text-sm text-red-600 whitespace-pre-wrap overflow-auto max-h-40">
                                        {this.state.error.toString()}
                                    </pre>
                                    {this.state.errorInfo && (
                                        <details className="mt-3">
                                            <summary className="cursor-pointer text-sm text-gray-700 font-medium">
                                                Component Stack
                                            </summary>
                                            <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={this.handleReload}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Sahifani Yangilash
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    <Home className="w-5 h-5" />
                                    Asosiy Sahifa
                                </button>
                            </div>

                            {/* Support Info */}
                            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Maslahat:</strong> Agar muammo davom etsa, ilovani qayta ishga tushiring yoki texnik yordam bilan bog'laning.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
