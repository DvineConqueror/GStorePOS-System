import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, queryKeys } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';

// Hook for fetching all categories
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiService.categories.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for creating a category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: apiService.categories.create,
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate categories cache
        queryClient.invalidateQueries({ queryKey: queryKeys.categories });
        
        toast({
          title: "Success",
          description: "Category created successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create category",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });
};
