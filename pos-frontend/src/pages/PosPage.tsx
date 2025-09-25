
import { CashierProductCatalog } from '@/components/pos/CashierProductCatalog';
import { Cart } from '@/components/pos/Cart';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { AnalyticsCharts } from '@/components/pos/AnalyticsCharts';
import { CashierAnalytics } from '@/components/pos/CashierAnalytics';
import { PersonalCashierAnalytics } from '@/components/pos/PersonalCashierAnalytics';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { AdvancedAnalytics } from '@/components/pos/AdvancedAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { PosProvider } from '@/context/PosContext';
import { Button } from '@/components/ui/button';
import { LogOut, ShoppingCart, BarChart3, History, User, Zap } from 'lucide-react';

function PosPageContent() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
            <p className="text-gray-600 mt-2">Process sales and manage transactions</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <Button onClick={signOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="pos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Point of Sale</span>
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
              {user?.role === 'manager' || user?.role === 'superadmin' ? (
                <>
                  {/* Admin sees all analytics with blue theme */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                      <AnalyticsCharts />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                      <CashierAnalytics />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                      <TransactionHistory />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Cashiers see only their personal analytics with blue theme */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                      <PersonalCashierAnalytics />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                      <TransactionHistory />
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
              <AdvancedAnalytics />
            </div>
          </TabsContent>
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
