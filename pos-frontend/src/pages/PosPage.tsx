
import { CashierProductCatalog } from '@/components/pos/CashierProductCatalog';
import { Cart } from '@/components/pos/Cart';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { AnalyticsCharts } from '@/components/pos/AnalyticsCharts';
import { CashierAnalytics } from '@/components/pos/CashierAnalytics';
import { PersonalCashierAnalytics } from '@/components/pos/PersonalCashierAnalytics';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { PosProvider } from '@/context/PosContext';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

function PosPageContent() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pos-primary/30 to-pos-background">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center p-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="bg-pos-primary/30 p-2 rounded-full">
              <img src="/images/BlesseStoreIcon.png" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full" alt="Store Logo" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-pos-primary">Grocery POS</h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="flex items-center space-x-2 text-gray-700">
              <span className="text-xs sm:text-sm">Cashier:</span>
              <span className="text-sm sm:text-base font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="text-sm border-pos-primary/20 text-pos-primary hover:bg-pos-primary/5"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-2 sm:p-3">
        <Tabs defaultValue="pos" className="flex flex-col">
          <div className="flex justify-center">
            <TabsList className="mb-1 bg-white/50 backdrop-blur-sm p-1 sm:p-2 rounded-lg border border-gray-100 w-full sm:w-auto">
              <TabsTrigger 
                value="pos" 
                className="text-sm sm:text-base data-[state=active]:bg-pos-primary data-[state=active]:text-white"
              >
                Point of Sale
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="text-sm sm:text-base data-[state=active]:bg-pos-primary data-[state=active]:text-white"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="pos" className="flex-grow flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-6">
            <div className="flex-1 md:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-4 min-h-0">
              <CashierProductCatalog />
            </div>
            <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-4">
              <Cart />
            </div>
            <CheckoutDialog />
          </TabsContent>
          
          <TabsContent value="analytics" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {user?.role === 'admin' ? (
              <>
                {/* Admin sees all analytics */}
                <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                  <AnalyticsCharts />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                  <CashierAnalytics />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                  <TransactionHistory />
                </div>
              </>
            ) : (
              <>
                {/* Cashiers see only their personal analytics */}
                <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                  <PersonalCashierAnalytics />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                  <TransactionHistory />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100 p-2 sm:p-4 text-center">
        <div className="container mx-auto text-xs sm:text-sm text-gray-600">
          Grocery POS System &copy; {new Date().getFullYear()}
        </div>
      </footer>
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
