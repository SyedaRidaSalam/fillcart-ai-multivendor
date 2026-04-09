"use client";

import StoreLayout from "@/components/store/StoreLayout";
import { SignIn, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function StoreLayoutWrapper({ children }) {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SignIn fallbackRedirectUrl="/store" routing="hash" />
      </div>
    );
  }

  return <StoreLayout>{children}</StoreLayout>;
}