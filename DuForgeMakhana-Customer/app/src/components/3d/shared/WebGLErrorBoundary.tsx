import React from 'react';

interface Props {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface State {
  failed: boolean;
}

/** Any renderer/scene error downgrades to the static fallback — never a blank hero. */
export default class WebGLErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('3D scene failed, using static fallback:', error.message);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
