import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { code } = await req.json();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Database se bilkul fresh data uthayen
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // 2. Plan ko clean karein (Lowercase + Trim)
    const currentPlan = (user?.plan || "free").toLowerCase().trim();
    
    // 🔥 SABSE ZAROORI: Yahan confirm karein ke isPlus tabhi true ho jab exact "plus" ho
    const isPlus = currentPlan === "plus";

    console.log("DEBUG -> User:", userId, "Plan in DB:", currentPlan, "isPlus:", isPlus);

    // 3. Coupon dhoondo
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        expiresAt: { gt: new Date() },
      },
    });

    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    // 4. STRICTOR MEMBER CHECK
    // Agar coupon sirf members ke liye hai aur user plus NAHI hai
    if (coupon.forMember === true) {
      if (!isPlus) {
        return NextResponse.json(
          { error: "Yeh coupon sirf Plus members ke liye hai. Aapka current plan " + currentPlan + " hai." },
          { status: 400 }
        );
      }
    }

    // 5. Success
    return NextResponse.json({ coupon }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}