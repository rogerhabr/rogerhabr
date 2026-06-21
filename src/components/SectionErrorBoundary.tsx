'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-6 p-5 bg-red-900/20 border border-red-800/60 rounded-xl">
          <p className="text-red-400 font-semibold text-sm mb-2">Section failed to render</p>
          <p className="text-red-300 text-xs font-mono break-all">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 px-3 py-1 bg-red-800/40 text-red-300 text-xs rounded hover:bg-red-800/60"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
