import React from 'react';
import { ColorScheme } from '@/utils/colorSchemes';

interface LoginLogoProps {
  isAdminMode: boolean;
  colors: ColorScheme;
}

export const LoginLogo: React.FC<LoginLogoProps> = ({ isAdminMode, colors }) => {
  return (
    <>
      {/* Mobile Logo - Only visible on small screens */}
      <div className="md:hidden mb-8 text-center transition-all duration-500 ease-in-out">
        <div className={`w-32 h-32 mx-auto mb-6 ${colors.logoIcon} rounded-full flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-105 shadow-lg`}>
          <img
            src={isAdminMode ? "/images/Manager_Logo.png" : "/images/Cashier_Logo.png"}
            alt={isAdminMode ? "Manager Logo" : "Cashier Logo"}
            className="w-24 h-24 object-contain transition-all duration-500 ease-in-out"
          />
        </div>
        <h2 className={`text-2xl font-bold ${colors.primaryText} transition-colors duration-500 ease-in-out mb-2`}>
          {isAdminMode ? 'Manager Dashboard' : 'Cashier POS'}
        </h2>
        <p className="text-gray-600 text-sm transition-colors duration-500">
          {isAdminMode 
            ? 'Manage your store operations and analytics' 
            : 'Process sales and manage transactions'}
        </p>
      </div>
      
      {/* Desktop Logo Section */}
      <div className={`logo-section hidden md:flex flex-col items-center justify-center p-12 ${colors.logoBg} rounded-xl transition-all duration-500 ease-in-out ${isAdminMode ? 'order-2' : 'order-1'} shadow-lg`}>
        <div className={`w-56 h-56 mb-8 ${colors.logoIcon} rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-105 shadow-xl`}>
          <img
            src={isAdminMode ? "/images/Manager_Logo.png" : "/images/Cashier_Logo.png"}
            alt={isAdminMode ? "Manager Logo" : "Cashier Logo"}
            className="w-44 h-44 object-contain transition-all duration-500"
          />
        </div>
        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-bold ${colors.primaryText} transition-colors duration-500`}>
            {isAdminMode ? 'Manager Dashboard' : 'Cashier POS'}
          </h2>
          <p className="text-gray-600 transition-colors duration-500 text-sm leading-relaxed max-w-xs">
            {isAdminMode 
              ? 'Manage operations & analytics' 
              : 'Process sales & track performance'}
          </p>
        </div>
      </div>
    </>
  );
};
