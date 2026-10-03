import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('GigMe ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReload = () => {
    // If it's a dynamic module import failure, clearing caches and reloading fixes stale chunks
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 mb-4 border border-rose-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Đã xảy ra lỗi tải giao diện</h3>
          <p className="text-xs text-[#C5E5EC]/70 max-w-sm mb-4">
            Ứng dụng vừa gặp sự cố tải module. Vui lòng tải lại hoặc thử lại sau giây lát.
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#204987] hover:brightness-110 text-white font-bold text-xs shadow-lg transition flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tải Lại Giao Diện</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
