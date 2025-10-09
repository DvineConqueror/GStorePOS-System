import { useState, useEffect, useMemo } from 'react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { Product, NewProduct, ProductFilters, ProductStats } from '@/types/product';
import { useToast } from '@/components/ui/use-toast';

export const useProductManagement = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    status: 'all',
  });

  // Add product form state
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showEditProductForm, setShowEditProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    price: '',
    category: '',
    stock: '',
    unit: 'pcs',
    image: null,
    imagePreview: '',
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getProducts();
      if (response.success) {
        setProducts(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from products
  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Add category
  const addCategory = async (categoryName: string) => {
    try {
      const response = await categoriesAPI.createCategory({ category: categoryName });
      if (response.success) {
        // Refresh categories after adding
        await fetchCategories();
        
        toast({
          title: "Category Added",
          description: "Category has been added successfully!",
          variant: "success",
        });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to add category');
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add category. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = !filters.search || 
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.sku.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      const matchesStatus = filters.status === 'all' || product.status === filters.status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, filters]);

  // Calculate product stats
  const productStats: ProductStats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      inactive: products.filter(p => p.status === 'inactive').length,
      lowStock: products.filter(p => p.stock <= p.minStock).length,
    };
  }, [products]);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewProduct({
          ...newProduct,
          image: file,
          imagePreview: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit product
  const editProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      setLoading(true);
      
      if (newProduct.image) {
        // If there's an image, use FormData
        const formData = new FormData();
        formData.append('productData', JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          stock: parseInt(newProduct.stock),
          unit: newProduct.unit,
        }));
        formData.append('image', newProduct.image);

        const response = await productsAPI.updateProduct(editingProduct._id, formData);
        if (response.success) {
          await fetchProducts();
          setShowEditProductForm(false);
          setEditingProduct(null);
          setNewProduct({
            name: '',
            price: '',
            category: '',
            stock: '',
            unit: 'pcs',
            image: null,
            imagePreview: '',
          });
          toast({
            title: "Product Updated",
            description: "Product has been updated successfully!",
            variant: "success",
          });
        } else {
          setError(response.message || 'Failed to update product');
          toast({
            title: "Error",
            description: response.message || 'Failed to update product',
            variant: "destructive",
          });
        }
      } else {
        // If no image, send regular JSON
        const productData = {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          stock: parseInt(newProduct.stock),
          unit: newProduct.unit,
        };

        const response = await productsAPI.updateProduct(editingProduct._id, productData);
        if (response.success) {
          await fetchProducts();
          setShowEditProductForm(false);
          setEditingProduct(null);
          setNewProduct({
            name: '',
            price: '',
            category: '',
            stock: '',
            unit: 'pcs',
            image: null,
            imagePreview: '',
          });
          toast({
            title: "Product Updated",
            description: "Product has been updated successfully!",
            variant: "success",
          });
        } else {
          setError(response.message || 'Failed to update product');
          toast({
            title: "Error",
            description: response.message || 'Failed to update product',
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      setError('Failed to update product');
      console.error('Error updating product:', err);
      toast({
        title: "Error",
        description: 'Failed to update product',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      unit: product.unit,
      image: null,
      imagePreview: product.image || '',
    });
    setShowEditProductForm(true);
  };

  // Add new product
  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (newProduct.image) {
        // If there's an image, use FormData
        const formData = new FormData();
        formData.append('productData', JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          stock: parseInt(newProduct.stock),
          unit: newProduct.unit,
        }));
        formData.append('image', newProduct.image);

        const response = await productsAPI.createProduct(formData);
        if (response.success) {
          await fetchProducts();
          setShowAddProductForm(false);
          setNewProduct({
            name: '',
            price: '',
            category: '',
            stock: '',
            unit: 'pcs',
            image: null,
            imagePreview: '',
          });
          toast({
            title: "Product Added",
            description: "Product has been added successfully!",
            variant: "success",
          });
        } else {
          setError(response.message || 'Failed to add product');
          toast({
            title: "Error",
            description: response.message || 'Failed to add product',
            variant: "destructive",
          });
        }
      } else {
        // If no image, send regular JSON
        const productData = {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          stock: parseInt(newProduct.stock),
          unit: newProduct.unit,
        };

        const response = await productsAPI.createProduct(productData);
        if (response.success) {
          await fetchProducts();
          setShowAddProductForm(false);
          setNewProduct({
            name: '',
            price: '',
            category: '',
            stock: '',
            unit: 'pcs',
            image: null,
            imagePreview: '',
          });
          toast({
            title: "Product Added",
            description: "Product has been added successfully!",
            variant: "success",
          });
        } else {
          setError(response.message || 'Failed to add product');
          toast({
            title: "Error",
            description: response.message || 'Failed to add product',
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      setError('Failed to add product');
      console.error('Error adding product:', err);
      toast({
        title: "Error",
        description: 'Failed to add product',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle product status
  const toggleProductStatus = async (productId: string, currentStatus: 'active' | 'inactive' | 'deleted') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await productsAPI.toggleProductStatus(productId);
      if (response.success) {
        await fetchProducts();
      } else {
        setError(response.message || 'Failed to update product status');
      }
    } catch (err) {
      setError('Failed to update product status');
      console.error('Error updating product status:', err);
    }
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    try {
      const response = await productsAPI.deleteProduct(productId);
      if (response.success) {
        await fetchProducts();
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (err) {
      setError('Failed to delete product');
      console.error('Error deleting product:', err);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  return {
    // Data
    products: filteredProducts,
    allProducts: products,
    categories,
    productStats,
    
    // State
    loading,
    error,
    filters,
    showAddProductForm,
    showEditProductForm,
    editingProduct,
    newProduct,
    
    // Actions
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
    fetchProducts,
    fetchCategories,
    addCategory,
  };
};