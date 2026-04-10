import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//Get dashboard data for seller (total orders, total earnings, total products)

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { error: "Unauthorized seller" },
        { status: 401 }
      );
    }

    // ✅ get store
    const store = await prisma.store.findUnique({
      where: { userId },
    });

    const storeId = store.id;

    //get all orders for seller
    const orders = await prisma.order.findMany({
      where: { storeId },
    });

    //get products
    const products = await prisma.product.findMany({
      where: { storeId },
    });

    //get ratings
    const ratings = await prisma.rating.findMany({
      where: {
        productId: { in: products.map(p => p.id) },
      },
      include: { user: true, product: true },
    });

    const dashboardData = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: Math.round(
        orders.reduce((acc, order) => acc + order.total, 0)
      ),
      totalProducts: products.length,
    };

    return NextResponse.json({ dashboardData }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}