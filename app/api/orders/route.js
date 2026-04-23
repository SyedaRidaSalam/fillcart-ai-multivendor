import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server"
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId, has } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const { addressId, items, couponCode, paymentMethod } = await req.json();

        if (!addressId || !items || !paymentMethod || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "missing order details" }, { status: 400 })
        }
        
        let coupon = null;
        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: { code: couponCode.toUpperCase() },
            })
            if (!coupon) {
                return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 })
            }
        }

        if (couponCode && coupon.forNewUser) {
            const userOrders = await prisma.order.findMany({
                where: { userId }
            })
            if (userOrders.length > 0) {
                return NextResponse.json({ error: "Coupon valid only for new users" }, { status: 400 })
            }
        }
        
        const isPlusMember = has({ plan: "plus" })
        if (couponCode && coupon.forMember) {
            if (!isPlusMember) {
                return NextResponse.json({ error: "Coupon valid only for members" }, { status: 400 })
            }
        }

        const ordersByStore = new Map()

        for (const item of items) {
            const productId = item.id || item.Id;
            const product = await prisma.product.findUnique({
                where: { id: productId }
            });

            if (!product) {
                return NextResponse.json({ error: `Product ${productId} not found` }, { status: 404 });
            }

            const storeId = product.storeId;
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, []);
            }
            ordersByStore.get(storeId).push({ ...item, productId, price: product.price });
        }

        let ordersIds = [];
        let fullAmount = 0;
        let isShippingFeeAdded = false;

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            if (coupon) {
                total -= (total * coupon.discount) / 100;
            }

            if (!isPlusMember && !isShippingFeeAdded) {
                total += 5; 
                isShippingFeeAdded = true;
            }

            fullAmount += parseFloat(total.toFixed(2));

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat(total.toFixed(2)),
                    paymentMethod, // Frontend se ab "PADDLE" ya "COD" aayega
                    isCouponUsed: !!coupon,
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });
            ordersIds.push(order.id);
        }

        await prisma.user.update({
            where: { id: userId },
            data: { cart: {} }
        })

        return NextResponse.json({ message: "Order placed successfully", orderIds: ordersIds, totalAmount: fullAmount }, { status: 201 })

    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// ✅ GET Orders Logic (Fixed for Paddle)
export async function GET(req) {
    try {
        const { userId } = getAuth(req);
        const orders = await prisma.order.findMany({
            where: {
                userId,
                OR: [
                    { paymentMethod: PaymentMethod.COD },
                    // Yahan STRIPE ki jagah PADDLE kar diya hai
                    { AND: [{ paymentMethod: PaymentMethod.PADDLE }, { isPaid: true }] }
                ]
            },
            include: {
                orderItems: { include: { product: true } },
                address: true,
            },
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json({ orders }, { status: 200 })
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}