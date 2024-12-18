import { prepareFFmpeg } from '@/ffmpeg/ffmpeg-webp';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, useEffect, useState } from 'react';

const IndexPage = lazy(() => import('@/components/IndexPage'));

const queryClient = new QueryClient();

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    prepareFFmpeg().then(() => setReady(true));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <IndexPage ready={ready} />
    </QueryClientProvider>
  );
}

export default App;
