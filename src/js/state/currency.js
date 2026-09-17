/**
 * Currency Engine & Converter
 * Gulshan Jewellers | Est. 1950
 */

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', rate: 1.0, label: 'INR (₹)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', rate: 0.012, label: 'USD ($)', locale: 'en-US' },
  AED: { code: 'AED', symbol: 'د.إ', rate: 0.044, label: 'AED (د.إ)', locale: 'ar-AE' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.0095, label: 'GBP (£)', locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.011, label: 'EUR (€)', locale: 'de-DE' }
};

export function formatPrice(inrAmount, targetCurrency = 'INR') {
  if (inrAmount === null || inrAmount === undefined) {
    return 'Price on Request';
  }

  const curr = CURRENCIES[targetCurrency] || CURRENCIES.INR;
  const converted = Math.round(inrAmount * curr.rate);

  if (targetCurrency === 'INR') {
    return `₹${inrAmount.toLocaleString('en-IN')}`;
  }

  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      maximumFractionDigits: 0
    }).format(converted);
  } catch (e) {
    return `${curr.symbol}${converted.toLocaleString()}`;
  }
}
