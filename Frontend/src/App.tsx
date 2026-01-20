import React from "react";
import LandingPage from "./pages/TSX/LandingPage";
import { Route, Routes, useLocation } from "react-router";
import ContactPage from "./pages/TSX/ContactPage";
import LoginPage from "./pages/TSX/LoginPage";
import RegisterPage from "./pages/TSX/RegisterPage";
import ForgotPasswordPage from "./pages/TSX/ForgotPasswordPage";
import ProductPage from "./pages/TSX/ProductPage";
import { AnimatePresence } from "framer-motion";
import ClickEffect from "./components/ClickEffect/ClickEffect";
import DetailProductPage from "./pages/TSX/DetailProductPage";

import ConfirmOtpPage from "./pages/TSX/ConfirmOtpPage";
import ChangePassPage from "./pages/TSX/ChangePassPage";
import MedicineChat from "./components/Chatbot/Chatbot";
import ShoppingCartPage from "./pages/TSX/ShoppingCart";
import PaymentPage from "./pages/TSX/PaymentPage";
import PaymentResult from "./pages/PaymentResult/PaymentResult";

function App() {
  const location = useLocation();
  return (
    <>
      <ClickEffect />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />}></Route>
          <Route path="/Contact" element={<ContactPage />}></Route>
          <Route path="/Login" element={<LoginPage />}></Route>
          <Route path="/Register" element={<RegisterPage />}></Route>
          <Route
            path="/ForgotPassword"
            element={<ForgotPasswordPage />}
          ></Route>
          <Route path="/Product" element={<ProductPage />}></Route>
          <Route path="/DetailProduct" element={<DetailProductPage />}></Route>
          <Route path="/ShoppingCart" element={<ShoppingCartPage />}></Route>
          <Route path="/Payment" element={<PaymentPage />}></Route>
          <Route path="/payment-result" element={<PaymentResult />}></Route>

          <Route path="/ConfirmOtp" element={<ConfirmOtpPage />}></Route>
          <Route path="/ChangePass" element={<ChangePassPage />}></Route>
          <Route path="/chat" element={<MedicineChat />}></Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
