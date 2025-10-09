import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload } from 'lucide-react';
import { NewProduct, Product } from '@/types/product';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  newProduct: NewProduct;
  categories: string[];
  onProductChange: (product: NewProduct) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  isEdit?: boolean;
  editingProduct?: Product | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  newProduct,
  categories,
  onProductChange,
  onImageChange,
  onSubmit,
  loading = false,
  isEdit = false,
  editingProduct = null,
}) => {
  const handleInputChange = (field: keyof NewProduct, value: string) => {
    onProductChange({
      ...newProduct,
      [field]: value,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          <DialogTitle className="text-lg text-black font-semibold">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col flex-1">
          <div className="flex-1">
            <div className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-black">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="mt-1 text-black placeholder:text-gray-400"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-black">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required
                      className="mt-1 pl-8 text-black placeholder:text-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="unit" className="text-sm font-medium text-black">Unit</Label>
                  <Input
                    id="unit"
                    value={newProduct.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    required
                    className="mt-1 text-black placeholder:text-gray-400"
                    placeholder="e.g., pcs, kg, lbs"
                  />
                </div>
                <div>
                  <Label htmlFor="stock" className="text-sm font-medium text-black">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    required
                    className="mt-1 text-black placeholder:text-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-black">Category</Label>
                  <Select value={newProduct.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1 text-black">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem className="text-black" key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  {/* Empty div for grid alignment */}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image" className="text-sm font-medium text-black">Product Image</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-black-700 hover:file:bg-green-100"
                  />
                  {newProduct.imagePreview && (
                    <div className="w-16 h-16 border rounded-lg overflow-hidden">
                      <img
                        src={newProduct.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="px-4 py-3 border-t flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Product' : 'Add Product')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
