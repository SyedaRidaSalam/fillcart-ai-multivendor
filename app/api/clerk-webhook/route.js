// ... existing imports
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const payload = await req.text();
    const headerList = await headers();

    const svix_id = headerList.get("svix-id");
    const svix_timestamp = headerList.get("svix-timestamp");
    const svix_signature = headerList.get("svix-signature");

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });

    // 🔥 SUBSCRIPTION EVENT (Jab user plan khareede ya change kare)
    if (event.type === "subscription.created" || event.type === "subscription.updated") {
      const userId = event.data.user_id;

      // 1. Clerk Update (Frontend ke liye)
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          plan: "plus",
        },
      });

      // 2. 🔥 NEON DB UPDATE (Yeh line miss thi - Isse Coupon chale ga)
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "plus" },
      });

      console.log(`WEBHOOK: User ${userId} updated to PLUS in Neon DB`);
    }

    // 🔥 OPTIONAL: Jab subscription khatam ho jaye (Downgrade to Free)
    if (event.type === "subscription.deleted") {
        const userId = event.data.user_id;

        await clerkClient.users.updateUser(userId, {
            publicMetadata: { plan: "free" },
        });

        await prisma.user.update({
            where: { id: userId },
            data: { plan: "free" },
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("WEBHOOK_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}