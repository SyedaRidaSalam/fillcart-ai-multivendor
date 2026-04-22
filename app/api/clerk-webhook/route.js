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

  // 3. SUBSCRIPTION LOGIC (Created/Updated)
  if (eventType === "subscription.created" || eventType === "subscription.updated") {
    
    // 🔥 FIX: Pehle payer.user_id check karein kyunki main 'id' subscription ID hoti hai
    const userId = 
      evt.data.payer?.user_id || 
      evt.data.user_id || 
      (evt.data.object ? evt.data.object.user_id : null);

    console.log("Processing User ID:", userId);

    // Filter out subscription IDs (csub_...)
    if (!userId || userId.startsWith("csub_")) {
      console.error("❌ Sync Error: Valid User ID not found (Got Subscription ID instead)");
      return NextResponse.json({ error: "Invalid User ID" }, { status: 200 });
    }

    try {
      // Step A: Neon Database update (Upsert)
      await prisma.user.upsert({
        where: { id: userId },
        update: { plan: "plus" },
        create: {
          id: userId,
          plan: "plus",
          name: evt.data.payer?.first_name || "Member",
          email: evt.data.payer?.email || "synced@test.com",
          image: "",
        },
      });

      // Step B: Clerk Metadata update (Clerk Dashboard ke liye)
      try {
        await clerkClient.users.updateUser(userId, {
          publicMetadata: { plan: "plus" },
        });
      } catch (e) {
        console.log("Clerk Metadata update skipped (likely test user)");
      }

      console.log(`✅ Successfully upgraded user ${userId} to PLUS`);
    } catch (error) {
      console.error("❌ Sync Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 200 });
    }
  }

  return NextResponse.json({ success: true });
}