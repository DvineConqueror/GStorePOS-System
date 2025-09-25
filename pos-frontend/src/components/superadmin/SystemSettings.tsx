import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Mail,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'Grocery Store POS',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    
    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 6,
    requireStrongPasswords: false,
    
    // Notification Settings
    emailNotifications: true,
    lowStockAlerts: true,
    systemAlerts: true,
    
    // Database Settings
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    
    // Store Settings
    storeName: 'Grocery Store',
    storeAddress: '123 Main St, City, State 12345',
    storePhone: '+1 (555) 123-4567',
    storeEmail: 'info@grocerystore.com',
    currency: 'USD',
    taxRate: 8.0,
  });

  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values.",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">System Settings</h2>
          <p className="text-slate-400 text-sm sm:text-base">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleReset}
            className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* System Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName" className="text-slate-300">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings(prev => ({ ...prev, systemName: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemVersion" className="text-slate-300">System Version</Label>
              <Input
                id="systemVersion"
                value={settings.systemVersion}
                disabled
                className="bg-slate-700/50 border-slate-600 text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode" className="text-slate-300">Maintenance Mode</Label>
                <p className="text-xs text-slate-400">Enable to put system in maintenance mode</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-slate-300">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts" className="text-slate-300">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength" className="text-slate-300">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => setSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireStrongPasswords" className="text-slate-300">Require Strong Passwords</Label>
                <p className="text-xs text-slate-400">Enforce complex password requirements</p>
              </div>
              <Switch
                id="requireStrongPasswords"
                checked={settings.requireStrongPasswords}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireStrongPasswords: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications" className="text-slate-300">Email Notifications</Label>
                <p className="text-xs text-slate-400">Send email notifications for system events</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lowStockAlerts" className="text-slate-300">Low Stock Alerts</Label>
                <p className="text-xs text-slate-400">Alert when products are low in stock</p>
              </div>
              <Switch
                id="lowStockAlerts"
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, lowStockAlerts: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemAlerts" className="text-slate-300">System Alerts</Label>
                <p className="text-xs text-slate-400">Show system-wide alerts and notifications</p>
              </div>
              <Switch
                id="systemAlerts"
                checked={settings.systemAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemAlerts: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Database Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBackup" className="text-slate-300">Automatic Backup</Label>
                <p className="text-xs text-slate-400">Enable automatic database backups</p>
              </div>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupFrequency" className="text-slate-300">Backup Frequency</Label>
              <select
                id="backupFrequency"
                value={settings.backupFrequency}
                onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="retentionDays" className="text-slate-300">Backup Retention (days)</Label>
              <Input
                id="retentionDays"
                type="number"
                value={settings.retentionDays}
                onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Store Settings */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base sm:text-lg">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName" className="text-slate-300">Store Name</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone" className="text-slate-300">Store Phone</Label>
                <Input
                  id="storePhone"
                  value={settings.storePhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, storePhone: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeEmail" className="text-slate-300">Store Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, storeEmail: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-slate-300">Currency</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-slate-300">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeAddress" className="text-slate-300">Store Address</Label>
                <Input
                  id="storeAddress"
                  value={settings.storeAddress}
                  onChange={(e) => setSettings(prev => ({ ...prev, storeAddress: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning */}
      <Card className="bg-yellow-900/20 border-yellow-600/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium">Important Notice</h4>
              <p className="text-yellow-300 text-sm mt-1">
                Changes to system settings may affect the entire application. Please review all changes carefully before saving.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
