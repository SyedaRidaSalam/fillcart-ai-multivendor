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

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing secret" }, { status: 500 });
  }

  // 1. Headers nikaalein
  const headerList = await headers();
  const svix_id = headerList.get("svix-id");
  const svix_timestamp = headerList.get("svix-timestamp");
  const svix_signature = headerList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // 2. Payload parse karein
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  // 3. Verify karein ke ye Clerk se hi aaya hai
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err.message);
    return new Response("Error: Invalid signature", { status: 400 });
  }

  const eventType = evt.type;
  console.log(`Webhook received: ${eventType}`);

  // 4. SUBSCRIPTION LOGIC
  if (eventType === "subscription.created" || eventType === "subscription.updated") {
    
    // 🔥 FIXED USER ID LOGIC: Har tarah ke Clerk data structure ko handle karega
    const userId = evt.data.user_id || evt.data.id || (evt.data.object ? evt.data.object.user_id : null);

    console.log("Processing User ID:", userId);

    if (!userId) {
      console.error("Sync Error: No valid User ID found in payload");
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
    }

    try {
      // Step A: Clerk Metadata update karein (Frontend ke liye)
      await clerkClient.users.updateUser(userId, {
        publicMetadata: { plan: "plus" },
      });

      // Step B: Neon Database update karein (Coupon API ke liye)
      await prisma.user.upsert({
        where: { id: userId },
        update: { plan: "plus" },
        create: {
          id: userId,
          plan: "plus",
          name: "Member", 
          email: "synced_via_webhook@test.com",
          image: "",
        },
      });

      console.log(`✅ Successfully upgraded user ${userId} to PLUS`);
    } catch (error) {
      console.error("❌ Sync Error:", error.message);
      // Status 200 isliye taake Clerk retry kar kar ke server na bitha de
      return NextResponse.json({ error: error.message }, { status: 200 });
    }
  }

  // 5. SUBSCRIPTION DELETED
  if (eventType === "subscription.deleted") {
    const userId = evt.data.user_id || evt.data.id || (evt.data.object ? evt.data.object.user_id : null);
    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: "free" }
        });
        await clerkClient.users.updateUser(userId, {
          publicMetadata: { plan: "free" },
        });
        console.log(`📉 User ${userId} downgraded to FREE`);
      } catch (e) {
        console.error("Delete Error:", e.message);
      }
    }
  }

  return NextResponse.json({ success: true });
}