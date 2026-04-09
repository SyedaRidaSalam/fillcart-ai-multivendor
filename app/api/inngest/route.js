import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { deleteCouponOnExpiry, syncUserCreation, syncUserUpdation, syncUserDeletion } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    deleteCouponOnExpiry,
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion
  ],
});