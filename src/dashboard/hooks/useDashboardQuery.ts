import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../../api/client';
import { useFilters } from '../filters/FiltersContext';

const PROJECT_ID = 45;

export function useDashboardQuery() {
  const { filters } = useFilters();
  return useQuery({
    queryKey: [
      'dashboard',
      PROJECT_ID,
      filters.days,
      filters.from ?? '',
      filters.to ?? '',
      filters.config,
    ],
    queryFn: () =>
      fetchDashboard({
        projectId: PROJECT_ID,
        days: filters.days,
        from: filters.from,
        to: filters.to,
        config: filters.config || undefined,
      }),
    staleTime: Infinity,
  });
}

export const PROJECT = PROJECT_ID;
