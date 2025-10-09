
import { CashierProductCatalog } from '@/components/pos/CashierProductCatalog';
import { Cart } from '@/components/pos/Cart';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { UnifiedAnalytics } from '@/components/pos/UnifiedAnalytics';
import { UnifiedCashierAnalytics } from '@/components/pos/UnifiedCashierAnalytics';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { PosProvider } from '@/context/PosContext';
import { Button } from '@/components/ui/button';
import { CashierLogo } from '@/components/ui/BrandLogo';
import { LogOut, ShoppingCart, BarChart3, History, User } from 'lucide-react';

function PosPageContent() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-cream-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <CashierLogo size="lg" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <Button onClick={signOut} variant="outline" className="bg-white hover:bg-green-50 border-green-200">
              <LogOut className="mr-2 h-4 w-4 text-green-600" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="pos" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-green-200">
            <TabsTrigger 
              value="pos" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
            >
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
              <span className="hidden sm:inline text-gray-700">Point of Sale</span>
              <span className="sm:hidden">POS</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
              <span className="hidden sm:inline text-gray-700">Analytics</span>
              <span className="sm:hidden text-gray-700">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* POS System Tab */}
          <TabsContent value="pos" className="space-y-4 lg:space-y-6">
            <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:gap-6">
              {/* Product Catalog - Better mobile layout */}
              <div className="flex-1 lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-3 lg:p-4 min-h-0">
                <CashierProductCatalog />
              </div>
              
              {/* Cart - Sticky on mobile for better UX */}
              <div className="w-full lg:w-1/3 lg:sticky lg:top-24 lg:self-start">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 lg:p-4">
                  <Cart />
                </div>
              </div>
              
              <CheckoutDialog />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {user?.role === 'manager' || user?.role === 'superadmin' ? (
                <div className="col-span-1 lg:col-span-2">
                  <UnifiedAnalytics />
                </div>
              ) : (
                <>
                  {/* Cashiers see only their personal analytics */}
                  <div className="col-span-1 lg:col-span-2">
                    <UnifiedCashierAnalytics />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Advanced Analytics Tab */}
        </Tabs>
      </div>
    </div>
  );
}

export default function PosPage() {
  return (
    <PosProvider>
      <PosPageContent />
    </PosProvider>
  );
}
