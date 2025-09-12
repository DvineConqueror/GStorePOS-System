import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { productsAPI } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { useEffect } from 'react';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product; // Add this for edit mode
}

export function ProductForm({ open, onClose, onSuccess, product }: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [stock, setStock] = useState(product?.stock.toString() || '');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when product changes
  useEffect(() => {
    setName(product?.name || '');
    setPrice(product?.price.toString() || '');
    setCategory(product?.category || '');
    setStock(product?.stock.toString() || '');
    setImagePreview(product?.image || '');
    setImage(null);
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      // Create preview URL for the new image
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Organized categories by groups
  const categoryGroups = {
    "Food": ['Snacks', 'Candies', 'Instant Noodles', 'Canned Goods'],
    "Beverages": ['Beverages', 'Soft Drinks', 'Juices', 'Water'],
    "Personal Care": ['Personal Care', 'Soap', 'Shampoo', 'Toothpaste'],
    "Other": ['Others']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // For now, we'll skip image upload and just use a placeholder
      // TODO: Implement image upload with the new backend
      const imageUrl = product?.image || null;

      const productData = {
        name,
        description: '', // Add description field if needed
        price: parseFloat(price),
        cost: 0, // Add cost field if needed
        barcode: '', // Add barcode field if needed
        sku: `SKU-${Date.now()}`, // Generate SKU
        category,
        brand: '', // Add brand field if needed
        stock: parseInt(stock),
        minStock: 0,
        maxStock: 1000,
        unit: 'pcs', // Default unit
        image: imageUrl,
        isActive: true,
        supplier: '' // Add supplier field if needed
      };

      let response;
      if (product) {
        // Update existing product
        response = await productsAPI.updateProduct(product._id, productData);
      } else {
        // Create new product
        response = await productsAPI.createProduct(productData);
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `Product ${product ? 'updated' : 'added'} successfully`,
        });

        onSuccess();
        onClose();
        setName('');
        setPrice('');
        setCategory('');
        setStock('');
        setImage(null);
      } else {
        throw new Error(response.message || 'Failed to save product');
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save product',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(categoryGroups).map(([groupName, categories]) => (
                  <SelectGroup key={groupName} className="relative">
                    <SelectLabel className="px-2 py-1.5 text-sm font-semibold bg-muted/50">{groupName}</SelectLabel>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="pl-4">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="image">Product Image</Label>
            {imagePreview && (
              <div className="mb-2 h-32 w-32 overflow-hidden rounded flex items-center justify-center bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}