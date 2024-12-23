import { VipsContext } from '@/hooks/use-vips';
import { Button, Text, Title } from '@mantine/core';
import { FC, PropsWithChildren, ReactElement, useEffect, useRef, useState } from 'react';
import Vips from 'wasm-vips';

export type InitializedVips = typeof Vips;

export const VipsProvider = ({
  children,
  errorFallback,
}: PropsWithChildren<{ errorFallback?: FC<ErrorFallbackProps> }>): ReactElement | null => {
  const ErrorFallback = errorFallback ?? DefaultErrorFallback;

  const [vips, setVips] = useState<InitializedVips>();
  const [error, setError] = useState<Error>();
  const mountRef = useRef(false);

  const loadVips = async () => {
    const vips = await Vips();
    setVips(vips);
  };

  useEffect(() => {
    if (mountRef.current) return;
    mountRef.current = true;
    loadVips().catch((err) => {
      if (err instanceof Error) {
        setError(err);
      } else {
        console.error('An error occurred while loading the external image processing library.', err);
      }
    });
  }, []);

  if (error && ErrorFallback) {
    return (
      <ErrorFallback
        error={error}
        onRetry={loadVips}
      />
    );
  }

  if (vips) {
    return <VipsContext.Provider value={vips}>{children}</VipsContext.Provider>;
  }

  return null;
};

export default VipsProvider;

interface ErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
}

const DefaultErrorFallback = ({ error, onRetry }: ErrorFallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen">
      <Title order={2}>An error occurred while loading the external image processing library.</Title>
      <Text>{error.message}</Text>
      {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
    </div>
  );
};
