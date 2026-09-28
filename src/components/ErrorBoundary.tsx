import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Unhandled app error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('local_app_custom_location');
      localStorage.removeItem('app_map_provider');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900 select-none">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[36px]">travel_explore</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              Syncing Location
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              We encountered a minor sync hiccup while locking your device location. Tap below to refresh your journey cleanly.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
