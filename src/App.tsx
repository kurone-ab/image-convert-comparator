import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';

const IndexPage = lazy(() => import('@/components/IndexPage'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        <IndexPage />
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
