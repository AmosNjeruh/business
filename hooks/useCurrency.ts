import { useBusinessCurrency } from "@/contexts/CurrencyProvider";

// Compatibility layer for components expecting formatPrice and convertUSDToKES
export const useCurrency = () => {
  const currency = useBusinessCurrency();
  
  // formatPrice: Takes amount in KES (base currency for frontend compatibility) and formats it
  // Since business suite uses NGN as base, we convert KES to USD first, then format
  const formatPrice = (amountInKES: number): string => {
    // Convert KES to USD (KES is base in frontend, so divide by rate)
    const USD_TO_KES_RATE = 130;
    const amountInUSD = amountInKES / USD_TO_KES_RATE;
    return currency.formatFromUSD(amountInUSD);
  };
  
  // convertUSDToKES: Converts USD to KES (for compatibility)
  const convertUSDToKES = (amountInUSD: number): number => {
    const USD_TO_KES_RATE = 130;
    return amountInUSD * USD_TO_KES_RATE;
  };
  
  return {
    ...currency,
    formatPrice,
    convertUSDToKES,
  };
};

export default useCurrency;

