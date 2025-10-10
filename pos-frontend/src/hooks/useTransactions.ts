import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, queryKeys } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';

// Hook for fetching transactions with pagination and filters
export const useTransactions = (params?: any) => {
  return useQuery({
    queryKey: queryKeys.transactionsList(params),
    queryFn: () => apiService.transactions.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes (transactions change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching a single transaction
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: queryKeys.transactionById(id),
    queryFn: () => apiService.transactions.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook for creating a transaction
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: apiService.transactions.create,
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate transactions cache
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
        
        toast({
          title: "Success",
          description: "Transaction completed successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create transaction",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    },
  });
};

// Hook for refunding a transaction
export const useRefundTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, refundData }: { id: string; refundData: any }) => 
      apiService.transactions.refund(id, refundData),
    onSuccess: (response, { id }) => {
      if (response.success) {
        // Invalidate transactions and specific transaction
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
        queryClient.invalidateQueries({ queryKey: queryKeys.transactionById(id) });
        
        toast({
          title: "Success",
          description: "Transaction refunded successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to refund transaction",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error refunding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to refund transaction",
        variant: "destructive",
      });
    },
  });
};
