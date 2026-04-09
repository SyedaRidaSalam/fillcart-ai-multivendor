//toggle stock of a product

import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        const {productId} = await req.json();

        if(!productId){
            return NextResponse.json({ error: "missing product id" }, { status: 400 });
        }
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        //check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        await prisma.product.update({
            where: { id: productId },
            data: { inStock: !product.inStock }
        });
        return NextResponse.json({ message: "Product stock updated successfully" }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
