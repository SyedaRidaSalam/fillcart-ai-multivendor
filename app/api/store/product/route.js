import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// ==============================
// ✅ ADD NEW PRODUCT (POST)
// ==============================
export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    // ✅ check seller
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ get store
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

    // ✅ get form data
    const formData = await req.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.getAll("images"); // ✅ FIXED

    // ✅ validation
    if (
      !name ||
      !description ||
      !mrp ||
      !price ||
      !category ||
      images.length < 1
    ) {
      return NextResponse.json(
        { error: "Missing product details" },
        { status: 400 }
      );
    }

    // ==============================
    // ✅ UPLOAD IMAGES TO IMAGEKIT
    // ==============================
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());

        const response = await imagekit.upload({
          file: buffer,
          fileName: image.name,
          folder: "products",
        });

        const url = imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "1024" },
          ],
        });

        return url;
      })
    );

    // ==============================
    // ✅ CREATE PRODUCT
    // ==============================
    const product = await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imageUrls,
        storeId,
      },
    });

    return NextResponse.json(
      {
        message: "Product added successfully",
        product,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 400 }
    );
  }
}


// ==============================
// ✅ GET ALL PRODUCTS (SELLER)
// ==============================
export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    // ✅ check seller
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ get store
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

    // ✅ get products
    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" }, // optional but good
    });

    return NextResponse.json(
      { products },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 400 }
    );
  }
}