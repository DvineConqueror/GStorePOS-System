import React from 'react';
import { Shield, BarChart3, ShoppingCart } from 'lucide-react';

interface BrandLogoProps {
  role: 'superadmin' | 'manager' | 'cashier';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BrandLogo({ role, size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const sizeConfig = {
    sm: {
      icon: 'h-6 w-6',
      text: 'text-lg',
      container: 'space-x-2'
    },
    md: {
      icon: 'h-8 w-8',
      text: 'text-xl',
      container: 'space-x-3'
    },
    lg: {
      icon: 'h-10 w-10',
      text: 'text-2xl',
      container: 'space-x-4'
    }
  };

  const config = sizeConfig[size];

  const roleConfig = {
    superadmin: {
      icon: Shield,
      title: 'Smart Grocery | Superadmin',
      subtitle: 'Monitor sales performance and manage store operations',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      gradient: 'from-green-500 to-green-600'
    },
    manager: {
      icon: BarChart3,
      title: 'Smart Grocery | Manager',
      subtitle: 'Monitor sales performance and manage store operations',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      gradient: 'from-green-500 to-green-600'
    },
    cashier: {
      icon: ShoppingCart,
      title: 'Smart Grocery',
      subtitle: 'Handle customer transactions and process daily sales',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      gradient: 'from-green-500 to-green-600'
    }
  };

  const roleInfo = roleConfig[role];
  const IconComponent = roleInfo.icon;

  return (
    <div className={`flex items-center ${config.container} ${className}`}>
      {/* Logo Icon with Gradient Background */}
      <div className={`relative ${roleInfo.bgColor} p-2 rounded-xl shadow-sm`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${roleInfo.gradient} opacity-10 rounded-xl`}></div>
        <IconComponent className={`${config.icon} ${roleInfo.color} relative z-10`} />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${config.text} font-bold text-gray-900 leading-tight`}>
            {roleInfo.title}
          </h1>
          <p className="text-xs text-gray-500 leading-tight">
            {roleInfo.subtitle}
          </p>
        </div>
      )}
    </div>
  );
}

// Individual role components for convenience
export function SuperadminLogo(props: Omit<BrandLogoProps, 'role'>) {
  return <BrandLogo {...props} role="superadmin" />;
}

export function ManagerLogo(props: Omit<BrandLogoProps, 'role'>) {
  return <BrandLogo {...props} role="manager" />;
}

export function CashierLogo(props: Omit<BrandLogoProps, 'role'>) {
  return <BrandLogo {...props} role="cashier" />;
}