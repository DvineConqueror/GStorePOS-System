import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FolderPlus } from 'lucide-react';
import { useProductManagement } from '@/hooks/useProductManagement';
import { ProductStats } from './ProductStats';
import { ProductFilters } from './ProductFilters';
import { ProductList } from './ProductList';
import { ProductForm } from './ProductForm';
import { useToast } from '@/components/ui/use-toast';

export const ProductManagement: React.FC = () => {
  const {
    products,
    categories,
    productStats,
    loading,
    error,
    filters,
    showAddProductForm,
    showEditProductForm,
    editingProduct,
    newProduct,
    setFilters,
    setShowAddProductForm,
    setShowEditProductForm,
    setEditingProduct,
    setNewProduct,
    handleImageChange,
    addProduct,
    editProduct,
    handleEditProduct,
    toggleProductStatus,
    deleteProduct,
    fetchCategories,
    addCategory,
  } = useProductManagement();

  const { toast } = useToast();
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setCategoryLoading(true);
    try {
      const success = await addCategory(newCategory.trim());
      if (success) {
        setNewCategory('');
        setShowAddCategoryDialog(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setCategoryLoading(false);
    }
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
                onClick={() => setShowAddProductForm(true)} 
                className="flex-1 sm:flex-initial"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="mt-4">
            <ProductFilters
              filters={filters}
              categories={categories}
              onSearchChange={handleSearchChange}
              onCategoryFilterChange={handleCategoryFilterChange}
              onStatusFilterChange={handleStatusFilterChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ProductList
            products={products}
            loading={loading}
            onToggleStatus={toggleProductStatus}
            onEdit={handleEditProduct}
            onDelete={deleteProduct}
          />
        </CardContent>
      </Card>

      {/* Add Product Form */}
      <ProductForm
        isOpen={showAddProductForm}
        onClose={() => setShowAddProductForm(false)}
        newProduct={newProduct}
        categories={categories}
        onProductChange={handleNewProductChange}
        onImageChange={handleImageChange}
        onSubmit={addProduct}
        loading={loading}
      />

      {/* Edit Product Form */}
      <ProductForm
        isOpen={showEditProductForm}
        onClose={() => {
          setShowEditProductForm(false);
          setEditingProduct(null);
        }}
        newProduct={newProduct}
        categories={categories}
        onProductChange={handleNewProductChange}
        onImageChange={handleImageChange}
        onSubmit={editProduct}
        loading={loading}
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
                disabled={categoryLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={categoryLoading}>
                {categoryLoading ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};