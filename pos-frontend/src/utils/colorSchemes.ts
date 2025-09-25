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

export const getColorScheme = (isAdminMode: boolean): ColorScheme => {
  const cashierColors: ColorScheme = {
    primary: 'from-blue-500/20 to-blue-100',
    cardBg: 'bg-white',
    primaryButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-200 focus:border-blue-500 focus:ring-blue-500/20',
    primaryHover: 'hover:bg-blue-600/10',
    logoBg: 'bg-blue-500/10',
    logoIcon: 'bg-blue-500/20'
  };

  const adminColors: ColorScheme = {
    primary: 'from-slate-800/20 to-slate-900/10',
    cardBg: 'bg-slate-50',
    primaryButton: 'bg-slate-800 hover:bg-slate-900 focus:ring-slate-600/20',
    primaryText: 'text-slate-800',
    primaryBorder: 'border-slate-300 focus:border-slate-600 focus:ring-slate-600/20',
    primaryHover: 'hover:bg-slate-800/10',
    logoBg: 'bg-slate-800/10',
    logoIcon: 'bg-slate-800/20'
  };

  return isAdminMode ? adminColors : cashierColors;
};
