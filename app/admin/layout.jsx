import AdminLayoutWrapper from "./AdminLayoutWrapper"; // wrapper for client logic

export const metadata = {
  title: "FillCart. - Admin",
  description: "FillCart. - Admin",
};

// Server component
export default function RootAdminLayout({ children }) {
  // Render client wrapper for auth
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}