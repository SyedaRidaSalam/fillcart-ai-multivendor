import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ plan: "free" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    // Return the plan from DB, or "free" if user not found
    return NextResponse.json({ plan: user?.plan || "free" });
    
  } catch (error) {
    console.error("API_USER_PLAN_ERROR:", error);
    // CRITICAL: Return a 200 with "free" plan so the frontend doesn't throw Axios Error 500
    return NextResponse.json({ plan: "free" });
  }
}