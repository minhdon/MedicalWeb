import CustomerInfo from "../../components/Customer/CustomerInfo/CustomerInfo";
import AppLayout from "../../components/Customer/Sidebar/Sidebar";

function CustomerPage() {
  return (
    <>
      <AppLayout>
        {" "}
        <CustomerInfo />
      </AppLayout>
    </>
  );
}
export default CustomerPage;
