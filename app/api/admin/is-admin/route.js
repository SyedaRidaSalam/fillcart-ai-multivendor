import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const isAdmin = await authAdmin(userId);

    return NextResponse.json({ isAdmin }, { status: 200 });
  } catch (error) {
    console.error("Error occurred while checking admin status:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}