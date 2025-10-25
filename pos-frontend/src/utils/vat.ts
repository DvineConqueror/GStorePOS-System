/**
 * VAT Calculation Utilities for Frontend
 * 
 * Philippine VAT (Value-Added Tax) calculations
 * - Default VAT rate: 12%
 * - All prices are VAT-inclusive by default
 */

export interface VATBreakdown {
  total: number;           // VAT-inclusive total
  vatAmount: number;       // Extracted VAT
  netSales: number;        // Net sales (total - VAT)
  vatRate: number;         // VAT rate applied
}

/**
 * Calculate VAT from VAT-inclusive total amount
 * @param totalAmount - VAT-inclusive total amount
 * @param vatRate - VAT rate percentage (default 12%)
 * @returns VATBreakdown object
 */
export function calculateVAT(
  totalAmount: number,
  vatRate: number = 12
): VATBreakdown {
  // Ensure valid inputs
  if (totalAmount < 0) totalAmount = 0;
  if (vatRate < 0 || vatRate > 100) vatRate = 12;

  // Calculate VAT amount from inclusive price
  // Formula: VAT = Total * (VATRate / (100 + VATRate))
  // For 12%: VAT = Total * (12 / 112)
  const vatAmount = totalAmount * (vatRate / (100 + vatRate));
  
  // Calculate net sales (amount before VAT)
  const netSales = totalAmount - vatAmount;

  // Round to 2 decimal places for currency
  return {
    total: Number(totalAmount.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    netSales: Number(netSales.toFixed(2)),
    vatRate: vatRate
  };
}

/**
 * Get default VAT rate for Philippines
 * @returns Default VAT rate (12%)
 */
export function getDefaultVATRate(): number {
  return 12;
}

