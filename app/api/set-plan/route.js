// /api/upgrade-plan/route.js (ya jo bhi aapka path hai)
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// /api/upgrade-plan/route.js
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { paddleTransactionId } = await req.json(); // Transaction ID lazmi mangwaein

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 🛑 AGAR PADDLE TRANSACTION ID NAHI HAI TO UPGRADE NA KAREIN
    if (!paddleTransactionId) {
       return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    await clerkClient.users.updateUser(userId, {
      publicMetadata: { plan: "plus" },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { plan: "plus" },
    });

    return NextResponse.json({ message: "Success! Upgraded to plus" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}