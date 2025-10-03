import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from '@/context/AuthContext';
import { DataPrefetchProvider } from '@/context/DataPrefetchContext';
import { RefreshProvider } from '@/context/RefreshContext';
import { SocketProvider } from '@/context/SocketContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';
import SuperadminRoute from '@/components/auth/SuperadminRoute';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import PosPage from './pages/PosPage';

// Import new modular components
import { AdminLayout } from '@/layouts/AdminLayout';
import { CashierLayout } from '@/layouts/CashierLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { CashierDashboard } from '@/pages/cashier/CashierDashboard';
import SuperadminLayout from '@/layouts/SuperadminLayout';
import SuperadminDashboard from '@/pages/superadmin/SuperadminDashboard';
import UserApproval from '@/components/superadmin/UserApproval';
import ManagerCreationForm from '@/components/superadmin/ManagerCreationForm';
import AllUsers from '@/components/superadmin/AllUsers';
import RecentTransactionsPage from '@/pages/RecentTransactionsPage';
import VoidRefundPage from '@/pages/VoidRefundPage';
import SystemSettings from '@/components/superadmin/SystemSettings';
import ApprovalStatusNotification from '@/components/notifications/ApprovalStatusNotification';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import { useState, useEffect } from 'react';

const App = () => {
  const queryClient = new QueryClient();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Show install prompt after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      if (!hasSeenPrompt) {
        setShowInstallPrompt(true);
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleInstallPromptDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataPrefetchProvider>
            <SocketProvider>
              <RefreshProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <ApprovalStatusNotification />
                {showInstallPrompt && (
                  <PWAInstallPrompt onDismiss={handleInstallPromptDismiss} />
                )}
                <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                
                {/* Role-based Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="cashiers" element={<AdminPage />} />
                  <Route path="products" element={<AdminPage />} />
                  <Route path="pos" element={<AdminPage />} />
                  <Route path="analytics" element={<AdminPage />} />
                  <Route path="settings" element={<AdminPage />} />
                </Route>
                
                {/* Cashier Routes */}
                <Route path="/cashier" element={
                  <ProtectedRoute>
                    <CashierLayout />
                  </ProtectedRoute>
                }>
                  <Route path="pos" element={<PosPage />} />
                  <Route path="analytics" element={<PosPage />} />
                  <Route path="history" element={<PosPage />} />
                  <Route path="profile" element={<PosPage />} />
                </Route>
                
                {/* Superadmin Routes (Hidden - accessible via direct URL) */}
                <Route path="/superadmin" element={
                  <SuperadminRoute>
                    <SuperadminLayout />
                  </SuperadminRoute>
                }>
                  <Route index element={<SuperadminDashboard />} />
                  <Route path="users" element={<AllUsers />} />
                  <Route path="approvals" element={<UserApproval />} />
                  <Route path="create-manager" element={<ManagerCreationForm />} />
                  <Route path="settings" element={<SystemSettings />} />
                </Route>
                
                {/* Transaction Management Routes */}
                <Route path="/transactions" element={
                  <ProtectedRoute>
                    <RecentTransactionsPage />
                  </ProtectedRoute>
                } />
                <Route path="/transactions/:transactionId/refund" element={
                  <AdminRoute>
                    <VoidRefundPage />
                  </AdminRoute>
                } />

                {/* Legacy Routes (for backward compatibility) */}
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <PosPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                } />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </TooltipProvider>
              </RefreshProvider>
            </SocketProvider>
          </DataPrefetchProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;