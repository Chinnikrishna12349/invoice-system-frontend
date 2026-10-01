import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[50vh] flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-lg w-full text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                            ⚠️
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {this.props.fallbackTitle || 'Unable to load page content'}
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            {this.props.fallbackMessage || 'An unexpected error occurred while rendering this page.'}
                        </p>
                        {this.state.error && (
                            <div className="mb-6 p-3 bg-gray-50 rounded-lg text-left text-xs font-mono text-red-600 max-h-32 overflow-y-auto border border-gray-200">
                                {this.state.error.message || String(this.state.error)}
                            </div>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                        >
                            <span>Reload Page</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
