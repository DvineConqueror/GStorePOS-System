import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Eye, EyeOff, AlertTriangle, Package } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  barcode?: string;
  sku: string;
  category: string;
  brand?: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  image?: string;
  isActive: boolean;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewProduct {
  name: string;
  price: string;
  category: string;
  stock: string;
  image: File | null;
  imagePreview: string;
}

interface ProductManagementProps {
  products: Product[];
  loading: boolean;
  showAddProductForm: boolean;
  newProduct: NewProduct;
  productSearchTerm: string;
  productCategoryFilter: string;
  productStatusFilter: string;
  filteredProducts: Product[];
  uniqueCategories: string[];
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onShowAddForm: (show: boolean) => void;
  onNewProductChange: (product: NewProduct) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddProduct: (e: React.FormEvent) => void;
  onToggleProductStatus: (productId: string, currentStatus: boolean) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  loading,
  showAddProductForm,
  newProduct,
  productSearchTerm,
  productCategoryFilter,
  productStatusFilter,
  filteredProducts,
  uniqueCategories,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onShowAddForm,
  onNewProductChange,
  onImageChange,
  onAddProduct,
  onToggleProductStatus
}) => {
  // Organized categories by groups (same as ProductForm)
  const categoryGroups = {
    "Food": ['Snacks', 'Candies', 'Instant Noodles', 'Canned Goods'],
    "Beverages": ['Beverages', 'Soft Drinks', 'Juices', 'Water'],
    "Personal Care": ['Personal Care', 'Soap', 'Shampoo', 'Toothpaste'],
    "Other": ['Others']
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Product Management</CardTitle>
            <Button onClick={() => onShowAddForm(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={productCategoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={productStatusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {showAddProductForm ? (
            <Dialog open={showAddProductForm} onOpenChange={onShowAddForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new product with basic information. Image upload will be implemented later.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onAddProduct} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => onNewProductChange({...newProduct, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => onNewProductChange({...newProduct, price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newProduct.category} onValueChange={(value) => onNewProductChange({...newProduct, category: value})} required>
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
                      value={newProduct.stock}
                      onChange={(e) => onNewProductChange({...newProduct, stock: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Product Image</Label>
                    {newProduct.imagePreview && (
                      <div className="mb-2 h-32 w-32 overflow-hidden rounded flex items-center justify-center bg-gray-100">
                        <img
                          src={newProduct.imagePreview}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={onImageChange}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Product
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <>
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No products found matching your criteria</p>
                      <p className="text-sm">Click "Add Product" to create your first product</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => (
                        <Card key={product._id} className={`${!product.isActive ? 'opacity-60' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{product.name}</CardTitle>
                                <p className="text-sm text-gray-600">{product.category}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {product.stock === 0 && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Price:</span>
                                <span className="font-medium">${product.price.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Stock:</span>
                                <span className={`font-medium ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                                  {product.stock} {product.unit}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">SKU:</span>
                                <span className="text-sm font-mono">{product.sku}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onToggleProductStatus(product._id, product.isActive)}
                                className="flex-1"
                              >
                                {product.isActive ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Show
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
