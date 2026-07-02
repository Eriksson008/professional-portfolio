import { Component, type ReactNode } from 'react';

/**
 * Error boundary for decorative visual layers: if a graphics component (or
 * its lazy chunk) throws, render nothing — the DOM/SVG fallback underneath
 * is always present, so a failed effect can never blank real content.
 */
export class SafeVisual extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
