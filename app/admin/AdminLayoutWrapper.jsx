"use client"; // client-only

import AdminLayout from "@/components/admin/AdminLayout";
import { SignIn, useAuth } from "@clerk/nextjs";

export default function AdminLayoutWrapper({ children }) {
  const { isSignedIn } = useAuth();

  return (
    <>
      {isSignedIn ? (
        <AdminLayout>{children}</AdminLayout>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <SignIn fallbackRedirectUrl="/admin" routing="hash" />
        </div>
      )}
    </>
  );
}