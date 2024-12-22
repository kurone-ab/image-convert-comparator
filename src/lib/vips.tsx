import { createContext, PropsWithChildren, useContext } from 'react';
import Vips from 'wasm-vips';

export type InitializedVips = typeof Vips;

const VipsContext = createContext<InitializedVips | null>(null);

export const useVips = () => {
  const vips = useContext(VipsContext);
  if (!vips) throw new Error('Vips is not initialized');
  return vips;
};

export const VipsProvider = ({ vips, children }: PropsWithChildren<{ vips: InitializedVips }>) => {
  return <VipsContext.Provider value={vips}>{children}</VipsContext.Provider>;
};
