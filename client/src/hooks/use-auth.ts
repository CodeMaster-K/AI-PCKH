import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export function useUser() {
  const { token, user } = useAuth();
  
  return useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;
      const response = await apiRequest("GET", "/api/auth/me", undefined, token);
      return await response.json();
    },
    enabled: !!token,
    initialData: user ? { user } : undefined,
  });
}
