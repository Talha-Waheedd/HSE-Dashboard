import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="bg-card p-8 rounded-xl border border-danger/30 shadow-xl max-w-md w-full text-center">
            <div className="mx-auto bg-danger/10 text-danger w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              The application encountered an unexpected error.
            </p>
            
            <div className="bg-muted p-4 rounded-md text-left text-sm text-foreground overflow-x-auto mb-6 border border-border">
              <code>{this.state.error?.message || "Unknown error occurred"}</code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
