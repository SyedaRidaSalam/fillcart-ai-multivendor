// import { headers } from "next/headers";
// import { Webhook } from "svix";
// import prisma from "@/lib/prisma";
// import { createClerkClient } from "@clerk/backend";
// import { NextResponse } from "next/server";

// const clerkClient = createClerkClient({
//   secretKey: process.env.CLERK_SECRET_KEY,
// });

// export async function POST(req) {
//   const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

//   if (!WEBHOOK_SECRET) {
//     console.error("Missing CLERK_WEBHOOK_SECRET");
//     return NextResponse.json({ error: "Missing secret" }, { status: 500 });
//   }

//   // 1. Webhook Headers extraction
//   const headerList = await headers();
//   const svix_id = headerList.get("svix-id");
//   const svix_timestamp = headerList.get("svix-timestamp");
//   const svix_signature = headerList.get("svix-signature");

//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response("Error: Missing svix headers", { status: 400 });
//   }

//   // 2. Parse and Verify Payload
//   const payload = await req.json();
//   const body = JSON.stringify(payload);
//   const wh = new Webhook(WEBHOOK_SECRET);
//   let evt;

//   try {
//     evt = wh.verify(body, {
//       "svix-id": svix_id,
//       "svix-timestamp": svix_timestamp, 
//       "svix-signature": svix_signature,
//     });
//   } catch (err) {
//     console.error("Error verifying webhook:", err.message);
//     return new Response("Error: Invalid signature", { status: 400 });
//   }

//   const eventType = evt.type;
//   console.log(`Webhook Event Received: ${eventType}`);

//   // 3. User ID Extraction (Strict check for csub_ IDs)
//   const userId = 
//     evt.data.payer?.user_id || 
//     evt.data.user_id || 
//     (evt.data.object ? evt.data.object.user_id : null);

//   if (!userId || userId.startsWith("csub_")) {
//     return NextResponse.json({ success: true, message: "Ignored: ID is not a User ID" });
//   }

//   try {
//     // --- START OF LOGIC ---
    
//     // Default values
//     let planToSet = "free"; 
//     const isSubscriptionEvent = eventType.startsWith("subscription.");

//     // ✅ SIRF Subscription events par status check karein
//     if (isSubscriptionEvent) {
//       const status = evt.data.status;
//       // Agar status active ya trialing hai toh hi plus hoga
//       if (status === "active" || status === "trialing") {
//         planToSet = "plus";
//       }
//     }

//     // ✅ NEON DATABASE SYNC
//     // Agar user.created hai: create block chalega (Plan: Free)
//     // Agar subscription.created/updated hai: update block chalega (Plan: status ke mutabiq)
//     await prisma.user.upsert({
//       where: { id: userId },
//       update: { 
//         // Plan sirf tab update karein jab signal subscription se aaye
//         ...(isSubscriptionEvent && { plan: planToSet })
//       },
//       create: {
//         id: userId,
//         plan: "free", // 👈 Hamesha naya user free se shuru hoga
//         name: evt.data.first_name || evt.data.payer?.first_name || "New User",
//         email: evt.data.email_addresses?.[0]?.email_address || evt.data.payer?.email || "sync@user.com",
//         image: evt.data.image_url || "",
//       },
//     });

//     // ✅ CLERK METADATA SYNC
//     // Metadata sirf tab badlein jab subscription ka koi action ho
//     if (isSubscriptionEvent) {
//       try {
//         await clerkClient.users.updateUser(userId, {
//           publicMetadata: { plan: planToSet },
//         });
//       } catch (e) {
//         console.log("Clerk update skipped (User might not exist yet)");
//       }
//     }

//     console.log(`✅ Success: ${userId} is now ${planToSet.toUpperCase()} via ${eventType}`);

//   } catch (error) {
//     console.error("❌ Sync Error:", error.message);
//   }

//   return NextResponse.json({ success: true });
// }
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
  const userId = evt.data.payer?.user_id || evt.data.user_id || (evt.data.object ? evt.data.object.user_id : null);

  if (!userId || userId.startsWith("csub_")) {
    return NextResponse.json({ success: true, message: "Ignored" });
  }

  try {
    // --- 1. NAME & EMAIL (No more null null) ---
    const firstName = evt.data.first_name || evt.data.payer?.first_name || "";
    const lastName = evt.data.last_name || evt.data.payer?.last_name || "";
    const email = evt.data.email_addresses?.[0]?.email_address || evt.data.payer?.email || "sync@user.com";
    
    let fullName = `${firstName} ${lastName}`.trim();
    if (!fullName || fullName === "null null") {
      fullName = email.split('@')[0]; 
    }

    // --- 2. PLAN LOGIC (STRICT CHECK) ---
    // Hum default undefined rakhenge taake update block bina wajah plan na badle
    let planToSet = undefined; 
    const isSubscriptionEvent = eventType.startsWith("subscription.");

    if (isSubscriptionEvent) {
      const status = evt.data.status;
      planToSet = (status === "active" || status === "trialing") ? "plus" : "free";
    }

 
// --- 3. NEON DATABASE SYNC ---
    await prisma.user.upsert({
      where: { id: userId },
      update: { 
        name: fullName,
        image: evt.data.image_url || "",
        // STRICT: Plan tabhi badle jab event subscription ka ho AUR planToSet define ho
        ...(isSubscriptionEvent && planToSet !== undefined ? { plan: planToSet } : {})
      },
      create: {
        id: userId,
        plan: "free", // Naya user hamesha free
        name: fullName,
        email: email,
        image: evt.data.image_url || "",
      },
    });

    // --- 4. CLERK METADATA SYNC ---
    // Sirf subscription event par metadata touch karein
    if (isSubscriptionEvent && planToSet !== undefined) {
      try {
        await clerkClient.users.updateUser(userId, {
          publicMetadata: { plan: planToSet },
        });
      } catch (e) {
        console.log("Clerk metadata sync skipped");
      }
    }

    console.log(`✅ Success: ${userId} processed`);

  } catch (error) {
    console.error("❌ Sync Error:", error.message);
  }

  return NextResponse.json({ success: true });
}