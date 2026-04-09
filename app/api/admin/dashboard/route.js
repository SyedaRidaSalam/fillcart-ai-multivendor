import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    //get total orders
    const orders = await prisma.order.count();
    //get total stores on app
    const stores = await prisma.store.count();
    //get all orders include only createdAt and total & calculate total revenue
    const allOrders = await prisma.order.findMany({
      select: {
        createdAt: true,
        total: true,
      },
    });
    let totalRevenue = 0;
    allOrders.forEach((order) => {
      totalRevenue += order.total;
    });
    const revenue = totalRevenue.toFixed(2);
    //total products n app
    const products = await prisma.product.count();
    const dashboardData = {
      orders,
      stores,
      revenue,
      products,
      allOrders,
    };
    return NextResponse.json({ dashboardData }, { status: 200 });
  } catch (error) {
    console.error("Error occurred while fetching dashboard data:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}
