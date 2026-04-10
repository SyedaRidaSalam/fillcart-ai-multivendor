import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// ======================
// UPDATE ORDER STATUS
// ======================
export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    const storeId = store.id;

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    // 🔥 IMPORTANT FIX (safe update)
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId: storeId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(
      { message: "Order status updated" },
      { status: 200 }
    );

  } catch (error) {
    console.error("POST ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}


// ======================
// GET ALL ORDERS
// ======================
export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    const storeId = store.id;

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        user: true,
        address: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error) {
    console.error("GET ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}