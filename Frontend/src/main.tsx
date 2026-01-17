import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";

import { SortProvider } from "./components/useContext/priceSortContext.tsx";
import { IndexProvider } from "./components/useContext/IndexProductContext.tsx";
import { PaymentPerProductProvider } from "./components/useContext/PaymentPerProduct.tsx";
import { IsInfoProvider } from "./components/useContext/checkInfoContext.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
      <AuthProvider>
        <PaymentPerProductProvider>
          <SortProvider>
            <IndexProvider>
              <IsInfoProvider>
                <App />
              </IsInfoProvider>
            </IndexProvider>
          </SortProvider>
        </PaymentPerProductProvider>
      </AuthProvider>
    </StrictMode>
  </BrowserRouter>
);

