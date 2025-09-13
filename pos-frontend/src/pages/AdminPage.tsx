import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, productsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AnalyticsCharts } from '@/components/pos/AnalyticsCharts';
import { CashierAnalytics } from '@/components/pos/CashierAnalytics';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { AdminAdvancedAnalytics } from '@/components/pos/AdminAdvancedAnalytics';
import { CashierProductCatalog } from '@/components/pos/CashierProductCatalog';
import { Cart } from '@/components/pos/Cart';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { PosProvider } from '@/context/PosContext';
import { ArrowLeft, UserCheck, UserX, Shield, Users, Search, Filter, Plus, Edit, Trash2, Package, BarChart3, History, LogOut, Eye, EyeOff, AlertTriangle, ShoppingCart, Zap } from 'lucide-react';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'cashier';
  isActive: boolean;
  createdAt: string;
}

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

const AdminPageContent = () => {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    cashierUsers: 0
  });
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    image: null as File | null,
    imagePreview: ''
  });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchUserStats();
      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      
      const response = await usersAPI.getUsers(params);
      
      if (response.success) {
        setUsers(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await usersAPI.getUserStats();
      
      if (response.success) {
        setUserStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
    }
  };

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

  // Organized categories by groups (same as ProductForm)
  const categoryGroups = {
    "Food": ['Snacks', 'Candies', 'Instant Noodles', 'Canned Goods'],
    "Beverages": ['Beverages', 'Soft Drinks', 'Juices', 'Water'],
    "Personal Care": ['Personal Care', 'Soap', 'Shampoo', 'Toothpaste'],
    "Other": ['Others']
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

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await usersAPI.deactivateUser(userId);
        toast({
          title: "Success",
          description: "User deactivated successfully",
        });
      } else {
        await usersAPI.reactivateUser(userId);
        toast({
          title: "Success",
          description: "User reactivated successfully",
        });
      }
      fetchUsers(); // Refresh the list
      fetchUserStats(); // Refresh stats
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
      console.error('Error updating user status:', error);
    }
  };

  const handleAddUser = () => {
    // Navigate to user creation form or open modal
    toast({
      title: "Feature Coming Soon",
      description: "User creation form will be implemented in the next phase",
    });
  };

  const handleLogout = () => {
    signOut();
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


  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter users for display
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users, products, and system settings</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Admin: {user?.firstName} {user?.lastName}</span>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Product Management</span>
              <span className="sm:hidden">Products</span>
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">POS System</span>
              <span className="sm:hidden">POS</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cashiers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.cashierUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Cashiers</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.cashierUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admins</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.adminUsers || 0}</div>
                </CardContent>
              </Card>
            </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>User Management</CardTitle>
              <Button onClick={handleAddUser} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userProfile) => (
                      <TableRow key={userProfile._id}>
                        <TableCell className="font-medium">
                          {userProfile.firstName} {userProfile.lastName}
                        </TableCell>
                        <TableCell>{userProfile.username}</TableCell>
                        <TableCell>{userProfile.email}</TableCell>
                        <TableCell>
                          <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                            {userProfile.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userProfile.isActive ? 'default' : 'destructive'}>
                            {userProfile.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(userProfile.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(userProfile._id, userProfile.isActive)}
                              disabled={userProfile._id === user.id} // Prevent admin from deactivating themselves
                            >
                              {userProfile.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Product Management Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Product Management</CardTitle>
                  <Button onClick={() => setShowAddProductForm(true)} className="w-full sm:w-auto">
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
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getUniqueCategories().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
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
                  <Dialog open={showAddProductForm} onOpenChange={setShowAddProductForm}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                          Create a new product with basic information. Image upload will be implemented later.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
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
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})} required>
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
                            onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
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
                            onChange={handleImageChange}
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
                                      onClick={() => handleToggleProductStatus(product._id, product.isActive)}
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
          </TabsContent>

          {/* POS System Tab */}
          <TabsContent value="pos" className="space-y-6">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-6">
              <div className="flex-1 md:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-0">
                <CashierProductCatalog />
              </div>
              <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Cart />
              </div>
              <CheckoutDialog />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Sales Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-800">
                    <AnalyticsCharts />
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Cashier Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-800">
                    <CashierAnalytics />
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-800">
                    <TransactionHistory />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Advanced Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-800">
                <AdminAdvancedAnalytics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const AdminPage = () => {
  return (
    <PosProvider>
      <AdminPageContent />
    </PosProvider>
  );
};

export default AdminPage;