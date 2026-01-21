import { createContext, useState, type ReactNode } from "react";

export type SortContextType = {
  typeSort: string;
  setSortType: (newType: string) => void;
};

const SortContext = createContext<SortContextType>({
  typeSort: "",
  setSortType: () => {},
});

type SortProviderProps = {
  children: ReactNode;
};

function SortProvider({ children }: SortProviderProps) {
  const [typeSort, setTypeSort] = useState("");

  const setSortType = (newType: string) => {
    setTypeSort(newType);
  };

  const value = {
    typeSort,
    setSortType,
  };

  return <SortContext.Provider value={value}>{children}</SortContext.Provider>;
}

export { SortContext, SortProvider };
