import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, queryKeys } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';

// Hook for fetching all products
export const useProducts = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.productsList(filters),
    queryFn: () => apiService.products.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching a single product
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.productById(id),
    queryFn: () => apiService.products.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for creating a product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: apiService.products.create,
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate and refetch products
        queryClient.invalidateQueries({ queryKey: queryKeys.products });
        queryClient.invalidateQueries({ queryKey: queryKeys.productStats() });
        
        toast({
          title: "Success",
          description: "Product created successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create product",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });
};

// Hook for updating a product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiService.products.update(id, data),
    onSuccess: (response, { id }) => {
      if (response.success) {
        // Invalidate and refetch products
        queryClient.invalidateQueries({ queryKey: queryKeys.products });
        queryClient.invalidateQueries({ queryKey: queryKeys.productById(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.productStats() });
        
        toast({
          title: "Success",
          description: "Product updated successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update product",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });
};

// Hook for deleting a product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: apiService.products.delete,
    onSuccess: (response, id) => {
      if (response.success) {
        // Remove from cache and invalidate
        queryClient.removeQueries({ queryKey: queryKeys.productById(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.products });
        queryClient.invalidateQueries({ queryKey: queryKeys.productStats() });
        
        toast({
          title: "Success",
          description: "Product deleted successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete product",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });
};

// Hook for toggling product status
export const useToggleProductStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: apiService.products.toggleStatus,
    onSuccess: (response, id) => {
      if (response.success) {
        // Invalidate products and specific product
        queryClient.invalidateQueries({ queryKey: queryKeys.products });
        queryClient.invalidateQueries({ queryKey: queryKeys.productById(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.productStats() });
        
        toast({
          title: "Success",
          description: "Product status updated successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update product status",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error toggling product status:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    },
  });
};
