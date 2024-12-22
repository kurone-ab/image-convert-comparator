import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';

const IndexPage = lazy(() => import('@/components/IndexPage'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IndexPage />
    </QueryClientProvider>
  );
}

export default App;
