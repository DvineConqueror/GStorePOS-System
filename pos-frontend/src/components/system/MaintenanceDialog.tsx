import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wrench } from 'lucide-react';

interface MaintenanceDialogProps {
  open: boolean;
  onClose: () => void;
  role: 'cashier' | 'manager';
  message?: string;
  onProceed?: () => void;
}

export function MaintenanceDialog({
  open,
  onClose,
  role,
  message = 'System is currently under maintenance. Some features may be unavailable.',
  onProceed,
}: MaintenanceDialogProps) {
  const isCashier = role === 'cashier';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-yellow-600" />
            </div>
            <DialogTitle className="text-lg text-black font-semibold">
              {isCashier ? 'System Under Maintenance' : 'Maintenance Mode Active'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1">
          <div className="flex-1">
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
              
              {!isCashier && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    As a manager, you can still access the system. However, some features may be limited during maintenance.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-4 pb-4 border-t bg-background flex-shrink-0">
            <Button
              type="button"
              onClick={isCashier ? onClose : onProceed}
              className={`w-full mt-3 font-medium ${
                isCashier 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isCashier ? 'OK, I Understand' : 'Proceed to Dashboard'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

