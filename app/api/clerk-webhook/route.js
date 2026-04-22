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
  // ✅ User ID Extraction
  const userId = evt.data.payer?.user_id || evt.data.user_id || (evt.data.object ? evt.data.object.user_id : null);

  if (!userId || userId.startsWith("csub_")) {
    return NextResponse.json({ success: true, message: "Ignored non-user ID" });
  }

  try {
    // 🚀 Logic for Created, Updated, and Deleted
    let targetPlan = "free";

    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      const status = evt.data.status;
      // Agar status active hai toh plus, warna free
      targetPlan = (status === "active" || status === "trialing") ? "plus" : "free";
    } 
    else if (eventType === "subscription.deleted") {
      targetPlan = "free";
    }

    // ✅ DB Update with UPSERT (Safe update)
    await prisma.user.upsert({
      where: { id: userId },
      update: { plan: targetPlan },
      create: {
        id: userId,
        plan: targetPlan,
        name: evt.data.payer?.first_name || "Member",
        email: evt.data.payer?.email || "sync@user.com",
      },
    });

    // ✅ Clerk Metadata Sync
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { plan: targetPlan },
    });

    console.log(`🔄 User ${userId} status set to: ${targetPlan.toUpperCase()}`);

  } catch (error) {
    console.error("❌ Webhook Sync Error:", error.message);
  }

  return NextResponse.json({ success: true });
}