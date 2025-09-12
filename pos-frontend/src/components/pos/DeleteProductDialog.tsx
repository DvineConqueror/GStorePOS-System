import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { productsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface DeleteProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  productName: string;
}

export function DeleteProductDialog({ open, onClose, onSuccess, productId, productName }: DeleteProductDialogProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const response = await productsAPI.deleteProduct(productId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });

        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to delete product',
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{productName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}