import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BusinessCurrencyProvider } from "@/contexts/CurrencyProvider";
import { BrandProvider } from "@/contexts/BrandContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <BusinessCurrencyProvider>
        <BrandProvider>
          <Component {...pageProps} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                fontSize: "13px",
              },
              success: {
                iconTheme: { primary: "#34d399", secondary: "#0f172a" },
              },
              error: {
                iconTheme: { primary: "#f87171", secondary: "#0f172a" },
              },
            }}
          />
        </BrandProvider>
      </BusinessCurrencyProvider>
    </ThemeProvider>
  );
}

