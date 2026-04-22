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
    console.error("Error verifying webhook:", err.message);
    return new Response("Error: Invalid signature", { status: 400 });
  }

  const eventType = evt.type;
  console.log(`Webhook received: ${eventType}`);

  // ✅ USER ID EXTRACTION (Keep it same)
  const userId = 
    evt.data.payer?.user_id || 
    evt.data.user_id || 
    (evt.data.object ? evt.data.object.user_id : null);

  if (!userId || userId.startsWith("csub_")) {
    return NextResponse.json({ success: true, message: "Ignored non-user ID" });
  }

  try {
    // --- START OF UPDATED LOGIC ---
    
    // 1. Determine Target Plan based on Event
    let targetPlan = "free"; // Default for signups (user.created)
    
    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      const status = evt.data.status;
      // Agar status active hai tabhi plus, warna free (for cancellations)
      targetPlan = (status === "active" || status === "trialing") ? "plus" : "free";
    } else if (eventType === "subscription.deleted") {
      targetPlan = "free";
    }

    // 2. Neon Database Sync
    await prisma.user.upsert({
      where: { id: userId },
      update: { plan: targetPlan }, // Existing user ka plan update hoga
      create: {
        id: userId,
        plan: "free", // ✅ FIX: Naya user signup par hamesha FREE hoga
        name: evt.data.first_name || evt.data.payer?.first_name || "New User",
        email: evt.data.email_addresses?.[0]?.email_address || evt.data.payer?.email || "sync@user.com",
        image: evt.data.image_url || "",
      },
    });

    // 3. Clerk Metadata Sync (Optional but good for UI badges)
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: { plan: targetPlan },
      });
    } catch (e) {
      console.log("Clerk Metadata update skipped");
    }

    console.log(`🔄 User ${userId} set to: ${targetPlan.toUpperCase()}`);
    // --- END OF UPDATED LOGIC ---

  } catch (error) {
    console.error("❌ Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }

  return NextResponse.json({ success: true });
}