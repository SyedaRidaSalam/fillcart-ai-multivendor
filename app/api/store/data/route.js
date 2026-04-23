import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

//get store info & store products

// export async function GET(req) {
//     try {
//        //get store usernam from query params
//            const { searchParams } = new URL(req.url);   
//         const username = searchParams.get("username").toLowerCase();
//         if (!username) {
//             return NextResponse.json({ error: "missing username" }, { status: 400 });
//         }

//         //get storeinfo and instock products with ratings
//         const store = await prisma.store.findUnique({
//             where: { username, isActive: true },
//             include: {Product: {include: {rating: true}}}
//         });
//         if (!store) {
//             return NextResponse.json({ error: "Store not found" }, { status: 400 });
//         }
//         return NextResponse.json({ store }, { status: 200 });
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({ error: error.code || error.message }, { status: 400 });
//     }
// }
export async function GET(req) {
    try {
        // get store username from query params
        const { searchParams } = new URL(req.url);   
        const username = searchParams.get("username")?.toLowerCase(); // added optional chaining for safety
        
        if (!username) {
            return NextResponse.json({ error: "missing username" }, { status: 400 });
        }

        // get storeinfo and instock products with rating (singular as per your schema)
        const store = await prisma.store.findUnique({
            where: { 
                username: username, 
                isActive: true 
            },
            include: {
                // Aapke schema mein Store model mein 'Product' (Capital P) likha hai
                Product: {
                    include: {
                        // FIX: Change 'ratings' to 'rating' to match Product model in schema
                        rating: true 
                    }
                }
            }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        return NextResponse.json({ store }, { status: 200 });

    } catch (error) {
        console.error("STORE_API_ERROR:", error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}