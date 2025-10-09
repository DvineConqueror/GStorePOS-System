import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSuperadminLayout } from '@/hooks/useSuperadminLayout';
import { SuperadminHeader } from '@/components/layouts/SuperadminHeader';
import { SuperadminSidebar } from '@/components/layouts/SuperadminSidebar';
import NotificationAlert from '@/components/notifications/NotificationAlert';
import { LayoutProps } from '@/types/layout';

export default function SuperadminLayout({ children }: LayoutProps) {
  const { quickStats, loadingStats, sidebarOpen, toggleSidebar, closeSidebar } = useSuperadminLayout();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <SuperadminHeader 
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          <SuperadminSidebar
            sidebarOpen={sidebarOpen}
            onCloseSidebar={closeSidebar}
            quickStats={quickStats}
            loadingStats={loadingStats}
          />
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4 sm:space-y-6">
              {/* Page Content */}
              <div className="min-h-[400px] sm:min-h-[600px]">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notification Alert */}
      <NotificationAlert />
    </div>
  );
}