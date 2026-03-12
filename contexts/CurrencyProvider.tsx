import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type SupportedCurrency = "USD" | "NGN" | "KES" | "EUR" | "GBP";

export interface BusinessCurrencyContextType {
  /** The ISO currency code currently selected by the user */
  selectedCurrency: SupportedCurrency;
  /** Symbol for the selected currency (₦, $, etc.) */
  currencySymbol: string;
  /** Format an amount that is stored in USD (backend canonical) into the user's currency */
  formatFromUSD: (amountInUSD: number) => string;
  /** Convert an amount in USD to the raw numeric amount in the user's currency */
  convertFromUSD: (amountInUSD: number) => number;
  /** Change the active currency (also persisted to localStorage) */
  setSelectedCurrency: (currency: SupportedCurrency) => void;
}

interface BusinessCurrencyProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "t360:business:preferredCurrency";

const STATIC_RATES_USD_TO: Record<SupportedCurrency, number> = {
  USD: 1,
  NGN: 1600, // approximate, matches existing NGN usage
  KES: 130,  // rough parity with frontend’s KES assumption
  EUR: 0.9,
  GBP: 0.78,
};

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  NGN: "₦",
  KES: "Ksh",
  EUR: "€",
  GBP: "£",
};

const BusinessCurrencyContext = createContext<BusinessCurrencyContextType | undefined>(
  undefined
);

export const BusinessCurrencyProvider: React.FC<BusinessCurrencyProviderProps> = ({
  children,
}) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<SupportedCurrency>("NGN");

  // Load initial preference from localStorage (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
    if (stored && STATIC_RATES_USD_TO[stored] !== undefined) {
      setSelectedCurrencyState(stored);
    }
  }, []);

  const setSelectedCurrency = useCallback((currency: SupportedCurrency) => {
    setSelectedCurrencyState(currency);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, currency);
    }
  }, []);

  const currencySymbol = useMemo(
    () => CURRENCY_SYMBOLS[selectedCurrency] ?? selectedCurrency,
    [selectedCurrency]
  );

  const convertFromUSD = useCallback(
    (amountInUSD: number): number => {
      if (!Number.isFinite(amountInUSD)) return 0;
      const rate = STATIC_RATES_USD_TO[selectedCurrency] ?? 1;
      return amountInUSD * rate;
    },
    [selectedCurrency]
  );

  const formatFromUSD = useCallback(
    (amountInUSD: number): string => {
      const value = convertFromUSD(amountInUSD);
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
      return `${currencySymbol} ${formatted}`;
    },
    [convertFromUSD, currencySymbol]
  );

  const value: BusinessCurrencyContextType = {
    selectedCurrency,
    currencySymbol,
    formatFromUSD,
    convertFromUSD,
    setSelectedCurrency,
  };

  return (
    <BusinessCurrencyContext.Provider value={value}>
      {children}
    </BusinessCurrencyContext.Provider>
  );
};

export const useBusinessCurrency = (): BusinessCurrencyContextType => {
  const ctx = useContext(BusinessCurrencyContext);
  if (!ctx) {
    throw new Error("useBusinessCurrency must be used within BusinessCurrencyProvider");
  }
  return ctx;
};

