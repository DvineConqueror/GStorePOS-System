import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Save,
  AlertTriangle,
  Wrench,
  Bell,
  Mail,
  Package
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { systemSettingsAPI } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { useRefresh } from '@/context/RefreshContext';
import { useDataPrefetch } from '@/context/DataPrefetchContext';

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [settings, setSettings] = useState({
    // Maintenance Mode
    maintenanceMode: false,
    maintenanceMessage: 'System is currently under maintenance. Some features may be unavailable.',
    
    // Notification Settings
    emailNotifications: true,
    lowStockAlerts: true,
    systemAlerts: true,
  });

  const { toast } = useToast();
  const { triggerRefresh } = useRefresh();
  const { refreshData } = useDataPrefetch();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetchingSettings(true);
      const response = await systemSettingsAPI.getSettings();
      if (response.data.success) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data.data,
        }));
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      toast({
        title: "Info",
        description: "Using default settings. Customize and save to persist changes.",
      });
    } finally {
      setFetchingSettings(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await systemSettingsAPI.updateSettings(settings);
      
      if (response.data.success) {
        toast({
          title: "Settings Saved",
          description: "System settings have been updated successfully.",
        });
        
        // Refresh data to reflect setting changes (e.g., low stock alerts toggle)
        await refreshData(['products', 'analytics', 'pendingCount']);
        
        // Trigger global refresh for all components
        triggerRefresh();
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  if (fetchingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header with Save button */}
        <div className="flex justify-end mb-1">
          <Button
            onClick={handleSave}
            disabled={loading || fetchingSettings}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        {/* Maintenance Mode Card */}
        <Card className="bg-white border-gray-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-black flex items-center text-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Settings className="h-5 w-5 text-green-600" />
              </div>
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <Label htmlFor="maintenanceMode" className="text-black font-medium text-base">
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable to restrict cashier access during system maintenance
                  </p>
                </div>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            {/* Maintenance Message */}
            <div className="space-y-3">
              <Label htmlFor="maintenanceMessage" className="text-black font-medium">
                Maintenance Message
              </Label>
              <Textarea
                id="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                className="border-gray-300 min-h-[50px] resize-none"
                placeholder="Enter message to display during maintenance..."
              />
              <p className="text-xs text-gray-500">
                This message will be shown to users when maintenance mode is active
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${settings.maintenanceMode ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                Status: {settings.maintenanceMode ? 'Maintenance Active' : 'System Operational'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card className="bg-white border-gray-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-black flex items-center text-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label htmlFor="emailNotifications" className="text-black font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Send email notifications for system events and alerts
                    </p>
                  </div>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              {/* Low Stock Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label htmlFor="lowStockAlerts" className="text-black font-medium">
                      Low Stock Alerts
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Alert when products are running low in stock (every 6 hours)
                    </p>
                  </div>
                </div>
                <Switch
                  id="lowStockAlerts"
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, lowStockAlerts: checked }))}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              {/* System Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label htmlFor="systemAlerts" className="text-black font-medium">
                      System Alerts
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Show real-time system alerts and notifications
                    </p>
                  </div>
                </div>
                <Switch
                  id="systemAlerts"
                  checked={settings.systemAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemAlerts: checked }))}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-yellow-900 font-medium">Important Notice</h4>
                <p className="text-yellow-800 text-sm mt-1">
                  Changes to system settings may affect the entire application. Please review all changes carefully before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}