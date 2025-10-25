/**
 * VAT Calculation Utilities
 * 
 * Philippine VAT (Value-Added Tax) calculations
 * - Default VAT rate: 12%
 * - All prices are VAT-inclusive by default
 * - Formula: VAT = Total * (VATRate / (100 + VATRate))
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
 * @returns VATBreakdown object with total, vatAmount, netSales, and vatRate
 */
export function calculateVATFromInclusive(
  totalAmount: number,
  vatRate: number = 12
): VATBreakdown {
  // Ensure valid inputs
  if (totalAmount < 0) {
    throw new Error('Total amount cannot be negative');
  }
  if (vatRate < 0 || vatRate > 100) {
    throw new Error('VAT rate must be between 0 and 100');
  }

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
 * Calculate total with VAT from net amount (VAT-exclusive)
 * @param netAmount - VAT-exclusive amount
 * @param vatRate - VAT rate percentage (default 12%)
 * @returns VATBreakdown object with total, vatAmount, netSales, and vatRate
 */
export function calculateVATFromExclusive(
  netAmount: number,
  vatRate: number = 12
): VATBreakdown {
  // Ensure valid inputs
  if (netAmount < 0) {
    throw new Error('Net amount cannot be negative');
  }
  if (vatRate < 0 || vatRate > 100) {
    throw new Error('VAT rate must be between 0 and 100');
  }

  // Calculate VAT amount
  const vatAmount = netAmount * (vatRate / 100);
  
  // Calculate total (net + VAT)
  const total = netAmount + vatAmount;

  // Round to 2 decimal places for currency
  return {
    total: Number(total.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    netSales: Number(netAmount.toFixed(2)),
    vatRate: vatRate
  };
}

/**
 * Format VAT breakdown for display
 * @param breakdown - VATBreakdown object
 * @param currency - Currency symbol (default ₱)
 * @returns Formatted string representation
 */
export function formatVATBreakdown(
  breakdown: VATBreakdown,
  currency: string = '₱'
): string {
  return `
Total (VAT Inclusive): ${currency}${breakdown.total.toFixed(2)}
VAT (${breakdown.vatRate}%): ${currency}${breakdown.vatAmount.toFixed(2)}
Net Sales: ${currency}${breakdown.netSales.toFixed(2)}
  `.trim();
}

/**
 * Validate VAT breakdown calculations
 * @param breakdown - VATBreakdown object
 * @returns true if calculations are valid
 */
export function validateVATBreakdown(breakdown: VATBreakdown): boolean {
  // Check if total equals netSales + vatAmount (with floating point tolerance)
  const calculatedTotal = breakdown.netSales + breakdown.vatAmount;
  const tolerance = 0.01; // 1 cent tolerance for rounding
  
  return Math.abs(calculatedTotal - breakdown.total) < tolerance;
}

/**
 * Get default VAT rate for Philippines
 * @returns Default VAT rate (12%)
 */
export function getDefaultVATRate(): number {
  return 12;
}

/**
 * Calculate VAT breakdown for multiple items
 * @param items - Array of items with price and quantity
 * @param vatRate - VAT rate percentage (default 12%)
 * @returns VATBreakdown for total of all items
 */
export function calculateVATForItems(
  items: Array<{ price: number; quantity: number }>,
  vatRate: number = 12
): VATBreakdown {
  // Calculate total from all items
  const total = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Calculate VAT breakdown
  return calculateVATFromInclusive(total, vatRate);
}

