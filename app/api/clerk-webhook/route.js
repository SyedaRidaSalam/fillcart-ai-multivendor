import { headers } from "next/headers";
import { Webhook } from "svix";
import prisma from "@/lib/prisma";
import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return NextResponse.json({ error: "Missing secret" }, { status: 500 });

  const headerList = await headers();
  const svix_id = headerList.get("svix-id");
  const svix_timestamp = headerList.get("svix-timestamp");
  const svix_signature = headerList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    return new Response("Error: Invalid signature", { status: 400 });
  }

  const eventType = evt.type;
  const userId = evt.data.payer?.user_id || evt.data.user_id || (evt.data.object ? evt.data.object.user_id : null);

  if (!userId || userId.startsWith("csub_")) {
    return NextResponse.json({ success: true, message: "Ignored non-user ID" });
  }

  try {
    // ✅ 1. AGAR SUBSCRIPTION ACTIVE HUI
    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      // Status check (kabhi kabhi update event cancel ke liye bhi aata hai)
      const status = evt.data.status;
      const targetPlan = (status === "ended" || status === "canceled") ? "free" : "plus";

      await prisma.user.update({
        where: { id: userId },
        data: { plan: targetPlan },
      });

      await clerkClient.users.updateUser(userId, {
        publicMetadata: { plan: targetPlan },
      });
      
      console.log(`✅ User ${userId} set to ${targetPlan}`);
    }

    // ✅ 2. AGAR SUBSCRIPTION DELETE/CANCEL HUI
    if (eventType === "subscription.deleted") {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "free" },
      });

      await clerkClient.users.updateUser(userId, {
        publicMetadata: { plan: "free" },
      });

      console.log(`📉 User ${userId} downgraded to FREE (Subscription Deleted)`);
    }

  } catch (error) {
    console.error("❌ Sync Error:", error.message);
  }

  return NextResponse.json({ success: true });
}