'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

const CHUNK_RELOAD_KEY = 'sa_chunk_reload_v1';

function isChunkError(err: Error) {
  return (
    err.name === 'ChunkLoadError' ||
    err.message?.includes('Loading chunk') ||
    err.message?.includes('Failed to fetch dynamically imported module') ||
    err.message?.includes('Importing a module script failed')
  );
}

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (!isChunkError(error)) return;
    try {
      const already = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!already) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        // Cache-bust the page URL so the browser fetches a fresh chunk manifest
        const url = new URL(window.location.href);
        url.searchParams.set('_cb', Date.now().toString());
        window.location.replace(url.toString());
      }
    } catch {
      // sessionStorage not available (private browsing edge cases) — do nothing
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunkErr = isChunkError(error);

    return (
      <div className="m-6 p-5 bg-red-900/20 border border-red-800/60 rounded-xl">
        <p className="text-red-400 font-semibold text-sm mb-2">Section failed to render</p>
        <p className="text-red-300 text-xs font-mono break-all">{error.message}</p>
        {chunkErr && (
          <p className="text-red-300/70 text-xs mt-2">
            A new version was deployed — click Reload to get the latest build.
          </p>
        )}
        <button
          onClick={() => {
            sessionStorage.removeItem(CHUNK_RELOAD_KEY);
            if (chunkErr) {
              window.location.reload();
            } else {
              this.setState({ error: null });
            }
          }}
          className="mt-3 px-3 py-1 bg-red-800/40 text-red-300 text-xs rounded hover:bg-red-800/60"
        >
          {chunkErr ? 'Reload' : 'Retry'}
        </button>
      </div>
    );
  }
}
