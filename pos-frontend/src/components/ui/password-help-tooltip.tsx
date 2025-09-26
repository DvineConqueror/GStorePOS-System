import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PasswordHelpTooltipProps {
  className?: string;
}

export function PasswordHelpTooltip({ className = "" }: PasswordHelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className={`h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help ${className}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">Password Requirements:</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase letter (A-Z)</li>
              <li>• Contains lowercase letter (a-z)</li>
              <li>• Contains number (0-9)</li>
              <li>• Contains special character (!@#$%^&*)</li>
            </ul>
            <p className="text-xs text-gray-600 mt-2">
              <strong>Example:</strong> MySecure123!
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
