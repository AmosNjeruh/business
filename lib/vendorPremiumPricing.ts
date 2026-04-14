/** Mirror API defaults; override with NEXT_PUBLIC_VENDOR_PREMIUM_* for display and Paystack amounts. */
export const VENDOR_PREMIUM_MONTHLY_USD = Number(
  process.env.NEXT_PUBLIC_VENDOR_PREMIUM_MONTHLY_USD ?? '29'
);
export const VENDOR_PREMIUM_ANNUAL_USD = Number(
  process.env.NEXT_PUBLIC_VENDOR_PREMIUM_ANNUAL_USD ?? '290'
);
