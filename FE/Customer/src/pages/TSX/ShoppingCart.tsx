import { Footer } from "../../components/HeaderFooter/TSX/Footer";
import { Header } from "../../components/HeaderFooter/TSX/Header";
import CustomerInfo from "../../components/ShoppingCart/CustomerInfo";
import StaffCustomerForm from "../../components/ShoppingCart/StaffCustomerForm";
import ShoppingCart from "../../components/ShoppingCart/ShoppingCart";
import { useAuth } from "../../contexts/AuthContext";

function ShoppingCartPage() {
  const { isStaff } = useAuth();

  return (
    <>
      <Header />
      <ShoppingCart />
      {/* Show simplified form for staff, full form for customers */}
      {isStaff ? <StaffCustomerForm /> : <CustomerInfo />}
      <Footer />
    </>
  );
}

export default ShoppingCartPage;
