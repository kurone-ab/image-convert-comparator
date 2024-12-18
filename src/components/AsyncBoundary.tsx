import { Component, PropsWithChildren, Suspense } from 'react';

class ErrorBoundary extends Component<PropsWithChildren, { hasError: boolean; error?: unknown }> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Error caught in Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

interface AsyncBoundaryProps {
  loading: React.ReactNode;
}

export default function AsyncBoundary(props: PropsWithChildren<AsyncBoundaryProps>) {
  return (
    <ErrorBoundary>
      <Suspense fallback={props.loading}>{props.children}</Suspense>
    </ErrorBoundary>
  );
}
