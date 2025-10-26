import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FolderPlus } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useToggleProductStatus } from '@/hooks/useProducts';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import { ProductStats } from './ProductStats';
import { ProductFilters } from './ProductFilters';
import { ProductList } from './ProductList';
import { ProductForm } from './ProductForm';
import { ProductFilters as ProductFiltersType } from '@/types/product';

interface ProductManagementProps {
  highlightProductId?: string | null;
  highlightAllLowStock?: boolean;
  onClearHighlight?: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ 
  highlightProductId,
  highlightAllLowStock = false,
  onClearHighlight 
}) => {
  // React Query hooks
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  
  // Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const toggleStatusMutation = useToggleProductStatus();
  const createCategoryMutation = useCreateCategory();

  // Local state
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: '',
    category: 'all',
    status: 'all',
  });
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showEditProductForm, setShowEditProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState<any>({
    name: '',
    price: '',
    category: '',
    stock: '',
    unit: 'pcs',
    image: null,
    imagePreview: '',
    isDiscountable: true,
    isVatExemptable: true,
  });
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; productId: string | null; productName: string }>({
    open: false,
    productId: null,
    productName: '',
  });

  // Reset form state function
  const resetFormState = () => {
    setNewProduct({
      name: '',
      price: '',
      category: '',
      stock: '',
      unit: 'pcs',
      image: null,
      imagePreview: '',
      isDiscountable: true,
      isVatExemptable: true,
    });
  };

  // Extract data from API responses
  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];
  const loading = productsLoading || categoriesLoading;
  const error = productsError ? 'Failed to load products' : null;


  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Always exclude deleted products
      if (product.status === 'deleted') return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (product.category !== filters.category) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (product.status !== filters.status) return false;
      }

      return true;
    });
  }, [products, filters]);

  // Calculate product stats (excluding deleted products)
  const productStats = useMemo(() => {
    const activeProducts = products.filter(p => p.status !== 'deleted');
    const totalProducts = activeProducts.length;
    const availableProducts = activeProducts.filter(p => p.status === 'available').length;
    const unavailableProducts = activeProducts.filter(p => p.status === 'unavailable').length;
    const outOfStockProducts = activeProducts.filter(p => p.stock === 0).length;
    const lowStockProducts = activeProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    
    return {
      total: totalProducts,
      available: availableProducts,
      unavailable: unavailableProducts,
      outOfStock: outOfStockProducts,
      lowStock: lowStockProducts,
    };
  }, [products]);

  // Event handlers
  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleCategoryFilterChange = (value: string) => {
    setFilters({ ...filters, category: value });
  };

  const handleStatusFilterChange = (value: string) => {
    setFilters({ ...filters, status: value });
  };

  const handleNewProductChange = (product: typeof newProduct) => {
    setNewProduct(product);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const preview = file ? URL.createObjectURL(file) : '';
    setNewProduct({ ...newProduct, image: file, imagePreview: preview });
  };

  const handleAddProduct = async (productData: any) => {
    await createProductMutation.mutateAsync(productData);
    setShowAddProductForm(false);
    resetFormState();
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      unit: product.unit,
      image: null,
      imagePreview: product.image || '',
      isDiscountable: product.isDiscountable !== undefined ? product.isDiscountable : true,
      isVatExemptable: product.isVatExemptable !== undefined ? product.isVatExemptable : true,
    });
    setShowEditProductForm(true);
  };

  const handleUpdateProduct = async (productData: any) => {
    if (editingProduct) {
      await updateProductMutation.mutateAsync({ id: editingProduct._id, data: productData });
      setShowEditProductForm(false);
      setEditingProduct(null);
      resetFormState();
    }
  };

  const handleToggleProductStatus = async (id: string) => {
    await toggleStatusMutation.mutateAsync(id);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteConfirmDialog({
      open: true,
      productId,
      productName,
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirmDialog.productId) {
      try {
        await deleteProductMutation.mutateAsync(deleteConfirmDialog.productId);
        setDeleteConfirmDialog({ open: false, productId: null, productName: '' });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmDialog({ open: false, productId: null, productName: '' });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    await createCategoryMutation.mutateAsync(newCategory.trim());
    setNewCategory('');
    setShowAddCategoryDialog(false);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">Error loading products</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Statistics */}
      <ProductStats stats={productStats} loading={loading} />

      {/* Product Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <CardTitle>Product Management</CardTitle>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="mt-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
              <ProductFilters
                filters={filters}
                categories={categories}
                onSearchChange={handleSearchChange}
                onCategoryFilterChange={handleCategoryFilterChange}
                onStatusFilterChange={handleStatusFilterChange}
              />
              <div className="flex gap-2 w-full lg:w-auto shrink-0">
                <Button 
                  onClick={() => setShowAddCategoryDialog(true)} 
                  variant="outline"
                  className="flex-1 lg:flex-initial whitespace-nowrap h-10"
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
                <Button 
                  onClick={() => setShowAddProductForm(true)} 
                  className="flex-1 lg:flex-initial whitespace-nowrap h-10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductList
            products={filteredProducts}
            loading={loading}
            onToggleStatus={handleToggleProductStatus}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            highlightProductId={highlightProductId}
            highlightAllLowStock={highlightAllLowStock}
            onClearHighlight={onClearHighlight}
          />
        </CardContent>
      </Card>

      {/* Add Product Form */}
      <ProductForm
        isOpen={showAddProductForm}
        onClose={() => {
          setShowAddProductForm(false);
          resetFormState();
        }}
        newProduct={newProduct}
        categories={categories}
        onProductChange={handleNewProductChange}
        onImageChange={handleImageChange}
        onSubmit={handleAddProduct}
        loading={createProductMutation.isPending}
      />

      {/* Edit Product Form */}
      <ProductForm
        isOpen={showEditProductForm}
        onClose={() => {
          setShowEditProductForm(false);
          setEditingProduct(null);
          resetFormState();
        }}
        newProduct={newProduct}
        categories={categories}
        onProductChange={handleNewProductChange}
        onImageChange={handleImageChange}
        onSubmit={handleUpdateProduct}
        loading={updateProductMutation.isPending}
        isEdit={true}
        editingProduct={editingProduct}
      />

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
            <DialogTitle className="text-lg text-black font-semibold">Add New Category</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddCategory} className="flex flex-col flex-1">
            <div className="flex-1">
              <div className="px-4 py-4 space-y-3">
                <div>
                  <Label htmlFor="categoryName" className="text-sm font-medium text-black">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g., Electronics, Food, Beverages"
                    required
                    className="mt-1 text-black placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="px-4 py-3 border-t flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddCategoryDialog(false)}
                disabled={createCategoryMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
            <DialogTitle className="text-lg text-black font-semibold">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="px-4 py-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <span className="font-semibold text-black">"{deleteConfirmDialog.productName}"</span>?
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This product will be marked as deleted and removed from the product list.
            </p>
          </div>
          <div className="px-4 py-3 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={cancelDelete} disabled={deleteProductMutation.isPending}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? 'Deleting...' : 'Delete Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};