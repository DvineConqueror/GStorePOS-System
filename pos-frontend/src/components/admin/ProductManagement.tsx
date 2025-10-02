import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Eye, EyeOff, AlertTriangle, Package, Edit, Trash2, FolderPlus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
  status: 'active' | 'inactive' | 'deleted';
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

interface Category {
  _id: string;
  name: string;
  group: string;
  description?: string;
  isActive: boolean;
}

interface CategoryGroup {
  _id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
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
  categories?: Category[];
  categoryGroups?: CategoryGroup[];
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onShowAddForm: (show: boolean) => void;
  onNewProductChange: (product: NewProduct) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddProduct: (e: React.FormEvent) => void;
  onToggleProductStatus: (productId: string, currentStatus: 'active' | 'inactive') => void;
  onDeleteProduct?: (productId: string) => void;
  onEditProduct?: (product: Product) => void;
  onCategoryAdded?: () => void;
  onCategoryGroupAdded?: () => void;
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
  categories = [],
  categoryGroups = [],
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onShowAddForm,
  onNewProductChange,
  onImageChange,
  onAddProduct,
  onToggleProductStatus,
  onDeleteProduct,
  onEditProduct,
  onCategoryAdded,
  onCategoryGroupAdded
}) => {
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    group: '',
    description: ''
  });
  const [newCategoryGroup, setNewCategoryGroup] = useState({
    name: '',
    description: ''
  });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  // Organize categories by groups dynamically from database
  const organizedCategories = React.useMemo(() => {
    const grouped: Record<string, string[]> = {};

    // Initialize groups from categoryGroups
    categoryGroups.forEach(group => {
      if (group.isActive) {
        grouped[group.name] = [];
      }
    });

    // If we have categories from the database, organize them
    if (categories.length > 0) {
      categories.forEach(cat => {
        if (cat.isActive) {
          if (!grouped[cat.group]) {
            grouped[cat.group] = [];
          }
          grouped[cat.group].push(cat.name);
        }
      });
    }

    return grouped;
  }, [categories, categoryGroups]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryLoading(true);

    try {
      const { categoryAPI } = await import('@/services/categoryService');
      await categoryAPI.create(newCategory);
      
      // Reset form
      setNewCategory({ name: '', group: '', description: '' });
      setShowAddCategoryDialog(false);
      
      // Notify parent to refresh categories
      if (onCategoryAdded) {
        onCategoryAdded();
      }

      // Show success toast (you can add a toast library)
      alert('Category added successfully!');
    } catch (error: any) {
      console.error('Failed to add category:', error);
      alert(error.response?.data?.message || 'Failed to add category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleAddCategoryGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupLoading(true);

    try {
      const { categoryGroupAPI } = await import('@/services/categoryGroupService');
      await categoryGroupAPI.create(newCategoryGroup);
      
      // Reset form
      setNewCategoryGroup({ name: '', description: '' });
      setShowAddGroupDialog(false);
      
      // Notify parent to refresh category groups
      if (onCategoryGroupAdded) {
        onCategoryGroupAdded();
      }

      alert('Category group added successfully!');
    } catch (error: any) {
      console.error('Failed to add category group:', error);
      alert(error.response?.data?.message || 'Failed to add category group');
    } finally {
      setGroupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Product Management</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => setShowAddCategoryDialog(true)} 
                variant="outline"
                className="flex-1 sm:flex-initial"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
              <Button 
                onClick={() => onShowAddForm(true)} 
                className="flex-1 sm:flex-initial"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 text-black"
              />
            </div>
            <Select value={productCategoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-black">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-black">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category} className="text-black">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={productStatusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-black">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-black">All Status</SelectItem>
                <SelectItem value="active" className="text-black">Active</SelectItem>
                <SelectItem value="inactive" className="text-black">Inactive</SelectItem>
                <SelectItem value="in-stock" className="text-black">In Stock</SelectItem>
                <SelectItem value="out-of-stock" className="text-black">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Category Dialog */}
          <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
            <DialogContent className="max-w-md p-0">
              <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
                <DialogTitle className="text-lg text-black font-semibold">Add New Category</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Create a new product category to organize your inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="flex flex-col flex-1">
                <div className="px-4 py-4 space-y-3">
                  <div>
                    <Label htmlFor="category-name" className="text-sm font-medium text-black">
                      Category Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Frozen Foods"
                      required
                      className="mt-1 text-black placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="category-group" className="text-sm font-medium text-black">
                        Category Group <span className="text-red-500">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddGroupDialog(true)}
                        className="h-auto py-0 px-2 text-xs text-green-600 hover:text-green-700"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        New Group
                      </Button>
                    </div>
                    <Select 
                      value={newCategory.group} 
                      onValueChange={(value) => setNewCategory({ ...newCategory, group: value })}
                      required
                    >
                      <SelectTrigger className="mt-1 text-black">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryGroups.length > 0 ? (
                          categoryGroups.map((group) => (
                            <SelectItem key={group._id} value={group.name} className="text-black">
                              {group.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Food" className="text-black">Food</SelectItem>
                            <SelectItem value="Beverages" className="text-black">Beverages</SelectItem>
                            <SelectItem value="Personal Care" className="text-black">Personal Care</SelectItem>
                            <SelectItem value="Other" className="text-black">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category-description" className="text-sm font-medium text-black">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Brief description of this category..."
                      rows={3}
                      className="mt-1 text-black placeholder:text-gray-400 resize-none"
                    />
                  </div>
                </div>
                <div className="px-4 pb-4 border-t bg-background flex-shrink-0 pt-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCategoryDialog(false)}
                      className="flex-1"
                      disabled={categoryLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={categoryLoading}
                    >
                      {categoryLoading ? 'Adding...' : 'Add Category'}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Category Group Dialog */}
          <Dialog open={showAddGroupDialog} onOpenChange={setShowAddGroupDialog}>
            <DialogContent className="max-w-md p-0">
              <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
                <DialogTitle className="text-lg text-black font-semibold">Add New Category Group</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Create a new category group to organize categories
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCategoryGroup} className="flex flex-col flex-1">
                <div className="px-4 py-4 space-y-3">
                  <div>
                    <Label htmlFor="group-name" className="text-sm font-medium text-black">
                      Group Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="group-name"
                      value={newCategoryGroup.name}
                      onChange={(e) => setNewCategoryGroup({ ...newCategoryGroup, name: e.target.value })}
                      placeholder="e.g., Household Items"
                      required
                      className="mt-1 text-black placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-description" className="text-sm font-medium text-black">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="group-description"
                      value={newCategoryGroup.description}
                      onChange={(e) => setNewCategoryGroup({ ...newCategoryGroup, description: e.target.value })}
                      placeholder="Brief description of this category group..."
                      rows={3}
                      className="mt-1 text-black placeholder:text-gray-400 resize-none"
                    />
                  </div>
                </div>
                <div className="px-4 pb-4 border-t bg-background flex-shrink-0 pt-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddGroupDialog(false)}
                      className="flex-1"
                      disabled={groupLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={groupLoading}
                    >
                      {groupLoading ? 'Adding...' : 'Add Group'}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Product Dialog */}
          <Dialog open={showAddProductForm} onOpenChange={onShowAddForm}>
              <DialogContent className="max-w-md p-0">
                <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
                  <DialogTitle className="text-lg text-black font-semibold">Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={onAddProduct} className="flex flex-col flex-1">
                  <div className="flex-1">
                    <div className="px-4 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium text-black">Product Name</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) => onNewProductChange({...newProduct, name: e.target.value})}
                            required
                            className="mt-1 text-black placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price" className="text-sm font-medium text-black">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) => onNewProductChange({...newProduct, price: e.target.value})}
                            required
                            className="mt-1 text-black placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="category" className="text-sm font-medium text-black">Category</Label>
                          <Select value={newProduct.category} onValueChange={(value) => onNewProductChange({...newProduct, category: value})} required>
                            <SelectTrigger className="mt-1 text-black">
                              <SelectValue placeholder="Select category" className="text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {Object.entries(organizedCategories).map(([groupName, categories]) => (
                                <SelectGroup key={groupName} className="relative">
                                  <SelectLabel className="px-2 py-1.5 text-sm font-semibold bg-muted/50 text-black">{groupName}</SelectLabel>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat} className="pl-4 text-black">
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="stock" className="text-sm font-medium text-black">Stock</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) => onNewProductChange({...newProduct, stock: e.target.value})}
                            required
                            className="mt-1 text-black placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-black">Product Image</Label>
                        <div className="mt-1">
                          {newProduct.imagePreview ? (
                            <div className="relative max-h-40 overflow-auto">
                              <div className="relative group">
                                <img
                                  src={newProduct.imagePreview}
                                  alt="Product preview"
                                  className="w-full object-contain rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 z-10 bg-red-500/90"
                                  onClick={() => onNewProductChange({...newProduct, image: null, imagePreview: ''})}
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer rounded-lg"
                              onClick={() => document.getElementById('image')?.click()}
                            >
                              <div className="flex flex-col items-center justify-center py-6">
                                <div className="text-center space-y-2">
                                  <div className="mx-auto h-8 w-8 text-gray-400 mb-2">
                                    <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-900">
                                      Click to upload product image
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      PNG, JPG, GIF up to 5MB
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={onImageChange}
                                className="hidden"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 border-t bg-background flex-shrink-0">
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white mt-3"
                    >
                      Add Product
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                        <Card key={product._id} className={`${product.status !== 'active' ? 'opacity-60' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg text-black">{product.name}</CardTitle>
                                <p className="text-sm text-gray-600">{product.category}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {product.stock === 0 && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                  {product.status === 'active' ? 'Active' : product.status === 'inactive' ? 'Inactive' : 'Deleted'}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Price:</span>
                                <span className="font-medium text-black">${product.price.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Stock:</span>
                                <span className={`font-medium ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                                  {product.stock} {product.unit}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">SKU:</span>
                                <span className="text-sm font-mono text-black">{product.sku}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              {onEditProduct && product.status !== 'deleted' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEditProduct(product)}
                                  className="flex-1"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                              )}
                              {product.status !== 'deleted' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onToggleProductStatus(product._id, product.status as 'active' | 'inactive')}
                                  className="flex-1"
                                >
                                  {product.status === 'active' ? (
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
                              )}
                              {onDeleteProduct && product.status !== 'deleted' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => onDeleteProduct(product._id)}
                                  className="flex-1"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
