import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiltersProvider } from './dashboard/filters/FiltersContext';
import { DashboardPage } from './dashboard/page/DashboardPage';
import { StabilityPage } from './stability/page/StabilityPage';
import { FailuresPage } from './failures/page/FailuresPage';
import { useRoute } from './routing/navigate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Never refetch automatically — the QA engineer refreshes manually.
      staleTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const route = useRoute();
  if (route === '/stability') return <StabilityPage />;
  if (route === '/failures') return <FailuresPage />;
  return <DashboardPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FiltersProvider>
        <Router />
      </FiltersProvider>
    </QueryClientProvider>
  );
}
