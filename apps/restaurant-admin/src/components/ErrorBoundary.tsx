import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="p-6 max-w-md mx-auto mt-8 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    <h3 className="text-lg font-bold mb-2">Sahifa yuklanmadi</h3>
                    <p className="text-sm mb-4">Xatolik yuz berdi. Sahifani yangilab ko‘ring.</p>
                    {this.state.error && (
                        <p className="text-xs opacity-80 font-mono break-all">{this.state.error.message}</p>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
