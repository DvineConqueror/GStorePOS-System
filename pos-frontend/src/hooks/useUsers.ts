import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, queryKeys } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';

// Hook for fetching users with filters
export const useUsers = (params?: any) => {
  return useQuery({
    queryKey: queryKeys.usersList(params),
    queryFn: () => apiService.users.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching user statistics
export const useUserStats = () => {
  return useQuery({
    queryKey: queryKeys.userStats(),
    queryFn: () => apiService.users.getStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching a single user
export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.userById(id),
    queryFn: () => apiService.users.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};


// Hook for updating a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: any }) => 
      apiService.users.update(id, userData),
    onSuccess: (response, { id }) => {
      if (response.success) {
        // Invalidate users and specific user
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        queryClient.invalidateQueries({ queryKey: queryKeys.userById(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
        
        toast({
          title: "Success",
          description: "User updated successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update user",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });
};

// Hook for toggling user status
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: apiService.users.toggleStatus,
    onSuccess: (response, id) => {
      if (response.success) {
        // Invalidate users and specific user
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        queryClient.invalidateQueries({ queryKey: queryKeys.userById(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
        
        toast({
          title: "Success",
          description: "User status updated successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update user status",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });
};
