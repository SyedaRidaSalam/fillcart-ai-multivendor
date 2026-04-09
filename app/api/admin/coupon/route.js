// import { inngest } from "@/inngest/client";
// import prisma from "@/lib/prisma";
// import authAdmin from "@/middlewares/authAdmin";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// //Add new coupon
// export async function POST(req) {
//   try {
//     const { userId } = getAuth(req);
//     const isAdmin = await authAdmin(userId);
//     if (!isAdmin) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const { coupon } = await req.json();
//     coupon.code = coupon.code.toUpperCase();
//     await prisma.coupon.create({
//       data: coupon,
//     }).then(async (coupon) => {
//         //Run inngest sheduler function to delete coupon on expire
//         await inngest.send({
//             name: "app/coupon.expired",
//             data: {
//                 code: coupon.code,
//                 expires_at: coupon.expiresAt,
//             }
//         });
//     });
//     return NextResponse.json(
//       { message: "Coupon added successfully" },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.code || error.message },
//       { status: 500 },
//     );
//   }
// }

// //Delete coupon
// export async function DELETE(req) {
//   try {
//     const { userId } = getAuth(req);
//     const isAdmin = await authAdmin(userId);
//     if (!isAdmin) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const { searchParams } = req.nextUrl;
//     const code = searchParams.get("code");
//     await prisma.coupon.delete({
//       where: { code },
//     });
//     return NextResponse.json(
//       { message: "Coupon deleted successfully" },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.code || error.message },
//       { status: 500 },
//     );
//   }
// }

// //Get all coupons
// export async function GET(req) {
//   try {
//     const { userId } = getAuth(req);
//     const isAdmin = await authAdmin(userId);
//     if (!isAdmin) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const coupons = await prisma.coupon.findMany({});
//     return NextResponse.json({ coupons }, { status: 200 });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.code || error.message },
//       { status: 500 },
//     );
//   }
// }
"use server";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Add new coupon
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { coupon } = await req.json();
    coupon.code = coupon.code.toUpperCase();

    const createdCoupon = await prisma.coupon.create({
      data: coupon,
    });

    // Send event to Inngest for auto-deletion
    await inngest.send({
      name: "app/coupon.expired",
      data: {
        code: createdCoupon.code,
        expires_at: createdCoupon.expiresAt,
      },
    });

    return NextResponse.json(
      { message: "Coupon added successfully", coupon: createdCoupon },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 500 });
  }
}

// Delete coupon
export async function DELETE(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");

    await prisma.coupon.delete({ where: { code } });

    return NextResponse.json({ message: "Coupon deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 500 });
  }
}

// Get all coupons
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const coupons = await prisma.coupon.findMany({});
    return NextResponse.json({ coupons }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 500 });
  }
}
