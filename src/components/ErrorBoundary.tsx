import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, LayoutGrid } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRASH] ErrorBoundary caught a runtime render crash:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    // Reset path or local app parameters
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0d0f17] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
          
          <div className="bg-[#161926] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Error Icon */}
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto shadow-lg">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Something went wrong
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                We couldn't load this section properly. Don't worry, your progress and study sessions are safe.
              </p>
            </div>

            {/* Diagnostic Message (Truncated & Safe) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-[10px] text-rose-300 font-mono text-left max-h-24 overflow-y-auto break-all scrollbar-thin">
                {this.state.error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
