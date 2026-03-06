import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logSystemEvent } from '../services/supabaseService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRecovering: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props;
    
    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Save state for display
    this.setState({ errorInfo });
    
    // Log to Supabase
    this.logErrorToSupabase(error, errorInfo);
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  private async logErrorToSupabase(error: Error, errorInfo: ErrorInfo) {
    const { componentName } = this.props;
    
    try {
      await logSystemEvent(
        'error',
        componentName || 'ErrorBoundary',
        error.message,
        {
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }
      );
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError);
    }
  }

  private handleReload = () => {
    this.setState({ isRecovering: true });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    const { hasError, error, errorInfo, isRecovering } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-gray-900 rounded-xl border border-red-900/50">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              An unexpected error occurred. The issue has been logged for investigation.
            </p>

            {/* Error Details (collapsible) */}
            {error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400 flex items-center gap-2 justify-center">
                  <Bug className="w-3 h-3" />
                  View error details
                </summary>
                <div className="mt-3 p-3 bg-gray-800 rounded-lg overflow-auto max-h-40">
                  <p className="text-xs text-red-400 font-mono mb-2">
                    {error.message}
                  </p>
                  {errorInfo && (
                    <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                disabled={isRecovering}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRecovering ? 'animate-spin' : ''}`} />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                disabled={isRecovering}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRecovering ? 'animate-spin' : ''}`} />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Status */}
            <p className="mt-6 text-xs text-gray-600">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

// HOC for wrapping functional components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary componentName={componentName || WrappedComponent.displayName || WrappedComponent.name}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook-friendly wrapper component
export function ErrorBoundaryWrapper({
  children,
  fallback,
  componentName,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}) {
  return (
    <ErrorBoundary fallback={fallback} componentName={componentName}>
      {children}
    </ErrorBoundary>
  );
}

export { ErrorBoundary };
export default ErrorBoundary;
