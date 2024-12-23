import { InitializedVips } from '@/lib/vips';
import { createContext, useContext } from 'react';

export const VipsContext = createContext<InitializedVips | undefined>(undefined);

export const useVips = () => {
  const vips = useContext(VipsContext);
  if (!vips) throw new Error('Vips is not initialized');
  return vips;
};