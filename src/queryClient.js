import { QueryClient } from '@tanstack/react-query'

// Único para toda la app (se exporta para poder limpiarlo al cambiar de liga)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
