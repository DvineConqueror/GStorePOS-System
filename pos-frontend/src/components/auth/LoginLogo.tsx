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
      <div className="md:hidden mb-6 text-center transition-all duration-500 ease-in-out">
        <div className={`w-24 h-24 mx-auto mb-4 ${colors.logoIcon} rounded-full flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-105`}>
          <img
            src={isAdminMode ? "/images/Manager_Logo.png" : "/images/Cashier_Logo.png"}
            alt={isAdminMode ? "Manager Logo" : "Cashier Logo"}
            className="w-20 h-20 object-contain transition-all duration-500 ease-in-out"
          />
        </div>
        <h2 className={`text-xl font-bold ${colors.primaryText} transition-colors duration-500 ease-in-out`}>
          {isAdminMode ? 'Manager Dashboard' : 'Cashier POS'}
        </h2>
      </div>
      
      {/* Desktop Logo Section */}
      <div className={`logo-section hidden md:flex flex-col items-center justify-center p-8 ${colors.logoBg} rounded-xl transition-all duration-500 ease-in-out ${isAdminMode ? 'order-2' : 'order-1'}`}>
        <div className={`w-48 h-48 mb-8 ${colors.logoIcon} rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-105`}>
          <img
            src={isAdminMode ? "/images/Manager_Logo.png" : "/images/Cashier_Logo.png"}
            alt={isAdminMode ? "Manager Logo" : "Cashier Logo"}
            className="w-40 h-40 object-contain transition-all duration-500"
          />
        </div>
        <div className="text-center space-y-4">
          <h2 className={`text-2xl font-bold ${colors.primaryText} transition-colors duration-500`}>
            {isAdminMode ? 'Manager Dashboard' : 'Cashier POS'}
          </h2>
          <p className="text-gray-600 transition-colors duration-500">
            {isAdminMode 
              ? 'Manage your store operations and analytics' 
              : 'Process sales and manage transactions'}
          </p>
        </div>
      </div>
    </>
  );
};
