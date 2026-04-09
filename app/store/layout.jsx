import StoreLayoutWrapper from "./StoreLayoutWrapper";

export const metadata = {
  title: "FillCart. - Store Dashboard",
  description: "FillCart. - Store Dashboard",
};

export default function RootStoreLayout({ children }) {
  return <StoreLayoutWrapper>{children}</StoreLayoutWrapper>;
}