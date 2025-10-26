/**
 * Senior Citizen & PWD Discount Calculation Utility
 * 
 * Complies with Philippine laws:
 * - RA 9994 (Expanded Senior Citizens Act of 2010)
 * - RA 10754 (An Act Expanding the Benefits and Privileges of Persons with Disability)
 * 
 * Discount Rules:
 * - 20% discount on qualified items
 * - 12% VAT exemption on qualified items
 * - Only applies to items marked as eligible
 * - Only applies to Senior Citizens or PWD customers
 */

export interface DiscountCalculation {
  originalPrice: number;
  netOfVAT: number;
  vatAmount: number;
  discountAmount: number;
  finalPrice: number;
  vatExempt: boolean;
  discountApplied: boolean;
}

export interface CartItemDiscount {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  netOfVAT: number;
  vatAmount: number;
  discountAmount: number;
  finalPrice: number;
  vatExempt: boolean;
  discountApplied: boolean;
}

export interface TransactionDiscount {
  subtotal: number;
  totalVatExempt: number;
  totalDiscountAmount: number;
  amountDue: number;
  items: CartItemDiscount[];
}

/**
 * Calculate discount for a single item
 * 
 * @param price - Unit price (VAT-inclusive)
 * @param isDiscountable - Product eligible for discount
 * @param isVatExemptable - Product eligible for VAT exemption
 * @param customerType - Type of customer ('regular', 'senior', 'pwd')
 * @returns Discount calculation breakdown
 */
export function calculateItemDiscount(
  price: number,
  isDiscountable: boolean,
  isVatExemptable: boolean,
  customerType: 'regular' | 'senior' | 'pwd'
): DiscountCalculation {
  // For regular customers or non-eligible items, no discount
  if (customerType === 'regular' || (!isDiscountable && !isVatExemptable)) {
    return {
      originalPrice: price,
      netOfVAT: price,
      vatAmount: 0,
      discountAmount: 0,
      finalPrice: price,
      vatExempt: false,
      discountApplied: false,
    };
  }

  // For Senior/PWD with eligible items
  let netOfVAT = price;
  let vatAmount = 0;
  let discountAmount = 0;
  let vatExempt = false;
  let discountApplied = false;

  // Step 1: Apply VAT exemption if eligible
  if (isVatExemptable) {
    netOfVAT = price / 1.12; // Remove 12% VAT
    vatAmount = price - netOfVAT;
    vatExempt = true;
  }

  // Step 2: Apply 20% discount on net amount if eligible
  if (isDiscountable) {
    discountAmount = netOfVAT * 0.20;
    discountApplied = true;
  }

  // Step 3: Calculate final price
  const finalPrice = netOfVAT - discountAmount;

  return {
    originalPrice: price,
    netOfVAT: Number(netOfVAT.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    vatExempt,
    discountApplied,
  };
}

/**
 * Calculate discounts for entire cart/transaction
 * 
 * @param items - Array of cart items with product details
 * @param customerType - Type of customer ('regular', 'senior', 'pwd')
 * @returns Complete transaction discount breakdown
 */
export function calculateTransactionDiscount(
  items: Array<{
    _id: string;
    name: string;
    price: number;
    quantity: number;
    isDiscountable: boolean;
    isVatExemptable: boolean;
  }>,
  customerType: 'regular' | 'senior' | 'pwd'
): TransactionDiscount {
  let subtotal = 0;
  let totalVatExempt = 0;
  let totalDiscountAmount = 0;
  let amountDue = 0;

  const processedItems: CartItemDiscount[] = items.map((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    // Calculate discount per item
    const discount = calculateItemDiscount(
      item.price,
      item.isDiscountable,
      item.isVatExemptable,
      customerType
    );

    // Accumulate totals
    const itemVatExempt = discount.vatAmount * item.quantity;
    const itemDiscountAmount = discount.discountAmount * item.quantity;
    const itemFinalPrice = discount.finalPrice * item.quantity;

    totalVatExempt += itemVatExempt;
    totalDiscountAmount += itemDiscountAmount;
    amountDue += itemFinalPrice;

    return {
      productId: item._id,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: itemTotal,
      netOfVAT: Number((discount.netOfVAT * item.quantity).toFixed(2)),
      vatAmount: Number(itemVatExempt.toFixed(2)),
      discountAmount: Number(itemDiscountAmount.toFixed(2)),
      finalPrice: Number(itemFinalPrice.toFixed(2)),
      vatExempt: discount.vatExempt,
      discountApplied: discount.discountApplied,
    };
  });

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalVatExempt: Number(totalVatExempt.toFixed(2)),
    totalDiscountAmount: Number(totalDiscountAmount.toFixed(2)),
    amountDue: Number(amountDue.toFixed(2)),
    items: processedItems,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get discount label based on customer type
 */
export function getDiscountLabel(customerType: 'regular' | 'senior' | 'pwd'): string {
  switch (customerType) {
    case 'senior':
      return 'Senior Citizen Discount (20%)';
    case 'pwd':
      return 'PWD Discount (20%)';
    default:
      return '';
  }
}

/**
 * Example calculation for testing
 */
export function exampleCalculation() {
  // Example: Senior citizen buying milk and cigarettes
  const items = [
    {
      _id: '1',
      name: 'Milk',
      price: 100,
      quantity: 2,
      isDiscountable: true,
      isVatExemptable: true,
    },
    {
      _id: '2',
      name: 'Cigarettes',
      price: 150,
      quantity: 1,
      isDiscountable: false,
      isVatExemptable: false,
    },
  ];

  const result = calculateTransactionDiscount(items, 'senior');
  
  console.log('Example Calculation:');
  console.log('Subtotal:', formatCurrency(result.subtotal)); // ₱350.00
  console.log('Less VAT Exempt:', formatCurrency(result.totalVatExempt)); // ₱21.43
  console.log('Less 20% Discount:', formatCurrency(result.totalDiscountAmount)); // ₱35.71
  console.log('Amount Due:', formatCurrency(result.amountDue)); // ₱292.86
  
  return result;
}

