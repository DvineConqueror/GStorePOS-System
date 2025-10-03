import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Package, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getColorScheme } from '@/utils/colorSchemes';

interface PendingUser {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  minStock: number;
  sku: string;
  category?: string;
}

interface NotificationData {
  pendingApprovals: {
    count: number;
    users: PendingUser[];
    enabled: boolean;
  };
  lowStockAlerts: {
    count: number;
    products: LowStockProduct[];
    enabled: boolean;
  };
  totalNotifications: number;
}

interface NotificationDialogProps {
  open: boolean;
  onClose: () => void;
  notificationData?: NotificationData;
  isLoading?: boolean;
}

export default function NotificationDialog({ 
  open, 
  onClose, 
  notificationData, 
  isLoading = false 
}: NotificationDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const colors = getColorScheme();

  const handleUserClick = (userId: string) => {
    onClose();
    if (user?.role === 'superadmin') {
      navigate('/superadmin/approvals');
    } else {
      navigate(`/dashboard?highlight=pending&userId=${userId}`);
    }
  };

  const handleViewAllApprovals = () => {
    onClose();
    if (user?.role === 'superadmin') {
      navigate('/superadmin/approvals');
    } else {
      navigate('/dashboard?highlight=pending');
    }
  };

  const handleViewAllProducts = () => {
    onClose();
    if (user?.role === 'superadmin') {
      navigate('/superadmin/inventory');
    } else {
      navigate('/dashboard?highlight=low-stock');
    }
  };

  const handleProductClick = (productId: string) => {
    onClose();
    if (user?.role === 'superadmin') {
      navigate(`/superadmin/inventory?productId=${productId}`);
    } else {
      navigate(`/dashboard?highlight=low-stock&productId=${productId}`);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'cashier': return 'Cashier';
      case 'manager': return 'Manager';
      default: return role;
    }
  };

  const getStockLevelColor = (stock: number, minStock: number) => {
    const ratio = stock / minStock;
    if (ratio <= 0.5) return 'bg-red-100 text-red-800';
    if (ratio <= 0.75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  if (!notificationData) {
    return null;
  }

  const hasNotifications = notificationData.totalNotifications > 0;
  const { pendingApprovals, lowStockAlerts } = notificationData;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            {hasNotifications ? (
              <>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {notificationData.totalNotifications}
                  </div>
                </div>
                <span>Notifications</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                </div>
                <span>No New Notifications</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {hasNotifications ? (
            <Tabs defaultValue="all" className="flex-1 flex flex-col">
              <TabsList className="mx-6 mb-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  All Notifications
                  <Badge className="bg-gray-100 text-gray-800 ml-1">
                    {notificationData.totalNotifications}
                  </Badge>
                </TabsTrigger>
                {pendingApprovals.count > 0 && (
                  <TabsTrigger value="approvals" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Approvals
                    <Badge className="bg-yellow-100 text-yellow-800 ml-1">
                      {pendingApprovals.count}
                    </Badge>
                  </TabsTrigger>
                )}
                {lowStockAlerts.count > 0 && (
                  <TabsTrigger value="stock" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Low Stock
                    <Badge className="bg-red-100 text-red-800 ml-1">
                      {lowStockAlerts.count}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all" className="flex-1 flex flex-col">
                <div className="px-6 pb-4">
                  <div className="space-y-4">
                    {/* Pending Approvals Section */}
                    {pendingApprovals.count > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-yellow-600" />
                            Pending User Approvals
                          </h3>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {pendingApprovals.count}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {pendingApprovals.users.slice(0, 3).map((pendingUser) => (
                            <div
                              key={pendingUser._id}
                              className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
                              onClick={() => handleUserClick(pendingUser._id)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {pendingUser.firstName} {pendingUser.lastName}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {pendingUser.email}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5">
                                      {getRoleDisplayName(pendingUser.role)}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {formatTimeAgo(pendingUser.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                          {pendingApprovals.count > 3 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleViewAllApprovals}
                              className="w-full mt-2"
                            >
                              View All {pendingApprovals.count} Pending Approvals
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Low Stock Alerts Section */}
                    {lowStockAlerts.count > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Low Stock Alerts
                          </h3>
                          <Badge className="bg-red-100 text-red-800">
                            {lowStockAlerts.count}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {lowStockAlerts.products.slice(0, 3).map((product) => (
                            <div
                              key={product._id}
                              className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                              onClick={() => handleProductClick(product._id)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    SKU: {product.sku} {product.category && `• ${product.category}`}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs px-1.5 py-0.5 ${getStockLevelColor(product.stock, product.minStock)}`}>
                                      Stock: {product.stock}/{product.minStock}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                          {lowStockAlerts.count > 3 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleViewAllProducts}
                              className="w-full mt-2"
                            >
                              View All {lowStockAlerts.count} Low Stock Products
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {pendingApprovals.count > 0 && (
                <TabsContent value="approvals" className="flex-1 flex flex-col">
                  <div className="px-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-yellow-600" />
                        Pending User Approvals
                      </h3>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {pendingApprovals.count}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {pendingApprovals.users.map((pendingUser) => (
                        <div
                          key={pendingUser._id}
                          className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
                          onClick={() => handleUserClick(pendingUser._id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {pendingUser.firstName} {pendingUser.lastName}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                {pendingUser.email}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5">
                                  {getRoleDisplayName(pendingUser.role)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(pendingUser.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleViewAllApprovals}
                      className={`w-full mt-4 ${colors.primaryButton} text-white`}
                    >
                      View All Approvals
                    </Button>
                  </div>
                </TabsContent>
              )}

              {lowStockAlerts.count > 0 && (
                <TabsContent value="stock" className="flex-1 flex flex-col">
                  <div className="px-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-red-600" />
                        Low Stock Alerts
                      </h3>
                      <Badge className="bg-red-100 text-red-800">
                        {lowStockAlerts.count}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {lowStockAlerts.products.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                          onClick={() => handleProductClick(product._id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                SKU: {product.sku} {product.category && `• ${product.category}`}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={`${getStockLevelColor(product.stock, product.minStock)}`}>
                                  Stock: {product.stock}/{product.minStock}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleViewAllProducts}
                      className={`w-full mt-4 ${colors.primaryButton} text-white`}
                    >
                      View All Products
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="px-6 py-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600 mb-6">
                  There are currently no pending approvals or low stock alerts.
                </p>
                <div className="space-y-3">
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                    <strong>When you'll see notifications:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>New users register for cashier positions</li>
                      <li>Products reach low stock levels</li>
                      <li>System maintenance notifications</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 border-t bg-gray-50 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-3"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
