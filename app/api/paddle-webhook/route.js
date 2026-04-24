import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();

    // Paddle se data nikalna 
    const eventType = body.event_type;
    const customData = body.data.custom_data;

    // Sirf tab order update karo jab payment successful ho
    if (eventType === "transaction.completed" || eventType === "transaction.paid") {
      
      // Order IDs jo humne frontend se bheji thi (customData mein)
      const orderIds = customData.orderIds.split(',').map(id => id.trim());

      // Database mein orders ko "Paid" mark karna
      await prisma.order.updateMany({
        where: {
          id: { in: orderIds },
        },
        data: {
          isPaid: true,
          // Agar aapke paas paymentStatus ka column hai toh:
          // status: "PAID" 
        },
      });

      console.log(`Orders ${orderIds} marked as paid!`);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}