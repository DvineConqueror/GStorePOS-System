import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { productsAPI, imageAPI } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { useEffect } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useRefresh } from '@/context/RefreshContext';

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
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [imageId, setImageId] = useState<string | null>(product?.image || null);
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image ? imageAPI.getImageUrl(product.image) : null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { triggerRefresh } = useRefresh();

  // Reset form when product changes
  useEffect(() => {
    setName(product?.name || '');
    setPrice(product?.price.toString() || '');
    setCategory(product?.category || '');
    setStock(product?.stock.toString() || '');
    setBarcode(product?.barcode || '');
    setImageId(product?.image || null);
    setImageUrl(product?.image ? imageAPI.getImageUrl(product.image) : null);
  }, [product]);

  const handleImageUploaded = (newImageId: string, newImageUrl: string) => {
    setImageId(newImageId);
    setImageUrl(newImageUrl);
  };

  const handleImageRemoved = () => {
    setImageId(null);
    setImageUrl(null);
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
      const productData = {
        name,
        description: '', // Add description field if needed
        price: parseFloat(price),
        cost: 0, // Add cost field if needed
        barcode: barcode || undefined, // Use the state, and send undefined if empty
        sku: product?.sku || `SKU-${Date.now()}`, // Use existing SKU for edits, generate new for creates
        category,
        brand: '', // Add brand field if needed
        stock: parseInt(stock),
        minStock: 0,
        maxStock: 1000,
        unit: 'pcs', // Default unit
        image: imageId || undefined, // Use the GridFS image ID, or undefined if no image
        status: 'active',
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

        // Trigger global refresh for all components
        triggerRefresh();
        
        onSuccess();
        onClose();
        setName('');
        setPrice('');
        setCategory('');
        setStock('');
        setImageId(null);
        setImageUrl(null);
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
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter product barcode (optional)"
              disabled={loading}
            />
          </div>
          <div>
            <Label>Product Image</Label>
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemoved}
              currentImageId={imageId}
              currentImageUrl={imageUrl}
              disabled={loading}
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