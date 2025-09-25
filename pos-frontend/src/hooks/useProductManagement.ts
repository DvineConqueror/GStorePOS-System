import { useState, useEffect } from 'react';
import { productsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

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

export const useProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
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
  
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      // Fetch ALL products (both active and inactive) for admin dashboard
      const response = await productsAPI.getProducts({});
      console.log('Full API response:', response);
      
      if (response.success) {
        setProducts(response.data);
        console.log('Products loaded:', response.data.length, 'products');
        console.log('Products data:', response.data);
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
        isActive: true,
        minStock: 0
      };

      // Only add image if it exists
      if (newProduct.imagePreview) {
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

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await productsAPI.updateProduct(productId, {
        isActive: !currentStatus
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Product ${!currentStatus ? 'activated' : 'temporarily removed'} successfully`,
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
    else if (productStatusFilter === 'active') matchesStatus = product.isActive;
    else if (productStatusFilter === 'inactive') matchesStatus = !product.isActive;
    // If productStatusFilter is 'all', matchesStatus remains true
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Debug logging (only when there are products)
  if (products.length > 0) {
    console.log('Product filtering debug:');
    console.log('- Total products:', products.length);
    console.log('- Filtered products:', filteredProducts.length);
    console.log('- Product status filter:', productStatusFilter);
  }

  return {
    // State
    products,
    loading,
    showAddProductForm,
    newProduct,
    productSearchTerm,
    productCategoryFilter,
    productStatusFilter,
    filteredProducts,
    
    // Actions
    fetchProducts,
    handleImageChange,
    handleAddProduct,
    handleToggleProductStatus,
    getUniqueCategories,
    
    // Setters
    setShowAddProductForm,
    setNewProduct,
    setProductSearchTerm,
    setProductCategoryFilter,
    setProductStatusFilter
  };
};
