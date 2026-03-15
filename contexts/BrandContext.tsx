// Business Suite – Brand Context
// Manages selected brand state across the application

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getBrands, BrandData } from "@/services/vendor";
import { getToken } from "@/services/auth";

interface Brand {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  niche?: string;
  activeCampaigns?: number;
  totalCampaigns?: number;
  partnersCount?: number;
  status?: string;
  createdAt?: string;
}

interface BrandContextType {
  brands: Brand[];
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;
  refreshBrands: () => Promise<void>;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const STORAGE_KEY = "t360:business:selectedBrandId";
const VENDOR_STORAGE_KEY = "selectedVendorId";

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrandState] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBrands = useCallback(async () => {
    // Check if user is authenticated before making API call
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      // No token - user is not authenticated, skip fetching brands
      setIsLoading(false);
      setBrands([]);
      setSelectedBrandState(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getBrands();
      const brandsList = Array.isArray(data) ? data : [];
      setBrands(brandsList);

      // Restore selected brand from localStorage
      if (typeof window !== "undefined") {
        const storedBrandId = localStorage.getItem(STORAGE_KEY);
        const storedVendorId = localStorage.getItem(VENDOR_STORAGE_KEY);
        const preferredId = storedBrandId || storedVendorId;

        if (preferredId) {
          const brand = brandsList.find((b) => b.id === preferredId);
          if (brand) {
            setSelectedBrandState(brand);
            // Keep both keys in sync so API context works everywhere.
            localStorage.setItem(STORAGE_KEY, brand.id);
            localStorage.setItem(VENDOR_STORAGE_KEY, brand.id);
            return;
          } else {
            // Stored brand ID is not in accessible brands - clear it
            console.warn("Stored brand ID not found in accessible brands, clearing selection");
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(VENDOR_STORAGE_KEY);
          }
        }

        if (brandsList.length > 0) {
          // No stored brand (or stored brand not found), select first.
          setSelectedBrandState(brandsList[0]);
          localStorage.setItem(STORAGE_KEY, brandsList[0].id);
          localStorage.setItem(VENDOR_STORAGE_KEY, brandsList[0].id);
        } else {
          setSelectedBrandState(null);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(VENDOR_STORAGE_KEY);
        }
      }
    } catch (err: any) {
      // Handle 403/401 - user doesn't have access to stored brand, clear it
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        console.warn("Unauthorized access - clearing stored brand selection");
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(VENDOR_STORAGE_KEY);
        }
      }
      // Handle 404 gracefully - brands endpoint may not be implemented yet
      if (err?.response?.status === 404) {
        console.warn("Brands endpoint not available yet (404). Continuing without brands.");
      } else {
        console.error("Failed to load brands:", err);
      }
      setBrands([]);
      setSelectedBrandState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBrands();
  }, [refreshBrands]);

  const setSelectedBrand = useCallback((brand: Brand | null) => {
    setSelectedBrandState(brand);
    if (typeof window !== "undefined") {
      if (brand) {
        localStorage.setItem(STORAGE_KEY, brand.id);
        // Mirror vendor app context key so backend RBAC/filtering stays consistent.
        localStorage.setItem(VENDOR_STORAGE_KEY, brand.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(VENDOR_STORAGE_KEY);
      }
    }
  }, []);

  return (
    <BrandContext.Provider
      value={{
        brands,
        selectedBrand,
        setSelectedBrand,
        refreshBrands,
        isLoading,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return context;
};
