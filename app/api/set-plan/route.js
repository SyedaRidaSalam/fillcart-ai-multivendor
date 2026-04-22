// /api/upgrade-plan/route.js (ya jo bhi aapka path hai)
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Clerk Metadata Update (Frontend ke liye)
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { plan: "plus" },
    });

    // 2. Neon Database Update (Backend/Coupon API ke liye)
    // Hum "plus" lowercase mein save karenge
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "plus" },
    });

    return NextResponse.json({ message: "Success! DB updated to plus" });
  } catch (error) {
    console.error("NEON_UPDATE_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}