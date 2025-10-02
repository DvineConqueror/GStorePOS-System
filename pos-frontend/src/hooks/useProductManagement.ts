import { useState, useEffect } from 'react';
import { productsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useRefresh } from '@/context/RefreshContext';
import { categoryAPI, Category } from '@/services/categoryService';
import { categoryGroupAPI, CategoryGroup } from '@/services/categoryGroupService';

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

export const useProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    price: '',
    category: '',
    stock: '',
    image: null,
    imagePreview: ''
  });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('all');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const { toast } = useToast();
  const { refreshTrigger } = useRefresh();

  const fetchProducts = async () => {
    try {
      // Fetch ALL products (both active and inactive) for admin dashboard
      const response = await productsAPI.getProducts({});
      
      if (response.success) {
        setProducts(response.data);
      } else {
        console.error('API returned success: false', response);
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      // Silent fail for categories - will use default categories
    }
  };

  const fetchCategoryGroups = async () => {
    try {
      const data = await categoryGroupAPI.getAll();
      setCategoryGroups(data);
    } catch (error: any) {
      console.error('Error fetching category groups:', error);
      // Silent fail for category groups - will use default groups
    }
  };

  // Refresh products, categories, and category groups when refresh trigger changes
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCategoryGroups();
  }, [refreshTrigger]); // Remove fetchProducts from dependencies to prevent infinite loop

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewProduct({...newProduct, image: file, imagePreview: URL.createObjectURL(file)});
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Only include the required fields and avoid sending undefined/null fields that cause issues
      const productData: any = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        stock: parseInt(newProduct.stock),
        sku: `SKU-${Date.now()}`,
        unit: 'pcs',
        status: 'active',
        minStock: 0
      };

      // Only add image if it exists and is a valid GridFS ID (not a blob URL)
      if (newProduct.imagePreview && !newProduct.imagePreview.startsWith('blob:')) {
        productData.image = newProduct.imagePreview;
      }

      const response = await productsAPI.createProduct(productData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        setShowAddProductForm(false);
        setNewProduct({
          name: '',
          price: '',
          category: '',
          stock: '',
          image: null,
          imagePreview: ''
        });
        fetchProducts();
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive"
      });
      console.error('Error creating product:', error);
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const response = await productsAPI.toggleProductStatus(productId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Product ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`,
        });
        fetchProducts(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update product status');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      });
      console.error('Error updating product status:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await productsAPI.deleteProduct(productId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        fetchProducts(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
      console.error('Error deleting product:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditProduct(product);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setEditProduct(null);
    setShowEditForm(false);
  };

  // Get unique categories from products for filter
  const getUniqueCategories = () => {
    const categories = products.map(product => product.category);
    return [...new Set(categories)].sort();
  };

  // Filter products for display
  const filteredProducts = products.filter(product => {
    const matchesSearch = !productSearchTerm || 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearchTerm.toLowerCase());
    
    const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
    
    let matchesStatus = true;
    if (productStatusFilter === 'in-stock') matchesStatus = product.stock > 0;
    else if (productStatusFilter === 'out-of-stock') matchesStatus = product.stock === 0;
    else if (productStatusFilter === 'active') matchesStatus = product.status === 'active';
    else if (productStatusFilter === 'inactive') matchesStatus = product.status === 'inactive';
    // If productStatusFilter is 'all', matchesStatus remains true
    
    return matchesSearch && matchesCategory && matchesStatus;
  });


  return {
    // State
    products,
    categories,
    categoryGroups,
    loading,
    showAddProductForm,
    newProduct,
    productSearchTerm,
    productCategoryFilter,
    productStatusFilter,
    filteredProducts,
    editProduct,
    showEditForm,
    
    // Actions
    fetchProducts,
    fetchCategories,
    fetchCategoryGroups,
    handleImageChange,
    handleAddProduct,
    handleToggleProductStatus,
    handleDeleteProduct,
    handleEditProduct,
    handleCloseEditForm,
    getUniqueCategories,
    
    // Setters
    setShowAddProductForm,
    setNewProduct,
    setProductSearchTerm,
    setProductCategoryFilter,
    setProductStatusFilter
  };
};
