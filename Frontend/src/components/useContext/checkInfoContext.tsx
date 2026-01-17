import { createContext, useState, type ReactNode } from "react";

export type CustomerDataType = {
  name: string;
  phone: string;
  email: string;
  address: string;
  recipientName?: string;
  recipientPhone?: string;
  note?: string;
  customerId?: string | null; // For existing customer lookup
  isNewCustomer?: boolean; // Flag for new customer creation
};

export type IsInfoContextType = {
  isInfo: boolean;
  setIsInfo: (newIsInfo: boolean) => void;
  customerData: CustomerDataType;
  setCustomerData: (data: CustomerDataType) => void;
};

const defaultCustomerData: CustomerDataType = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

const IsInfoContext = createContext<IsInfoContextType>({
  isInfo: false,
  setIsInfo: () => { },
  customerData: defaultCustomerData,
  setCustomerData: () => { },
});

type IsInfoProviderProps = {
  children: ReactNode;
};

function IsInfoProvider({ children }: IsInfoProviderProps) {
  const [isInfo, setIsInfo] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerDataType>(defaultCustomerData);

  const value = {
    isInfo,
    setIsInfo,
    customerData,
    setCustomerData,
  };

  return (
    <IsInfoContext.Provider value={value}>{children}</IsInfoContext.Provider>
  );
}

export { IsInfoContext, IsInfoProvider };
