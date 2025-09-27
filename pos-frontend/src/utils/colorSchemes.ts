export interface ColorScheme {
  primary: string;
  cardBg: string;
  primaryButton: string;
  primaryText: string;
  primaryBorder: string;
  primaryHover: string;
  logoBg: string;
  logoIcon: string;
}

// Unified green theme for all roles
export const getColorScheme = (): ColorScheme => {
  return {
    primary: 'from-green-500/20 to-green-100',
    cardBg: 'bg-stone-50',
    primaryButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500/20',
    primaryText: 'text-green-700',
    primaryBorder: 'border-green-200 focus:border-green-500 focus:ring-green-500/20',
    primaryHover: 'hover:bg-green-600/10',
    logoBg: 'bg-green-500/10',
    logoIcon: 'bg-green-500/20'
  };
};
