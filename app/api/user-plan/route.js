import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ plan: "free" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true }
  });

  return NextResponse.json({ plan: user?.plan || "free" });
}