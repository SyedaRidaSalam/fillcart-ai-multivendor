import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//Add new product
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //get the data from the form
    const formData = await req.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.get("images");    

    if (!name || !description || !mrp || !price || !category || !images.length < 1) {
      return NextResponse.json({ error: "missing product details" }, { status: 400 });
    }

    //uploading images to image kit
const imageUrl =await Promise.all(images.map(async (image) => {
  const buffer = Buffer.from(await image.arrayBuffer());
  const response = await imagekit.upload({
    file: buffer,
    fileName: image.name,
    folder: "products"
  });
  const url = imagekit.url({
    path: response.filePath,
    transformation: [
      { quality: "auto" },
      { format: "webp" },
        { width: "1024" }
    ]
  });
  return url;
}))
 await prisma.product.create({
  data: {
    name,
    description,
    mrp,
    price,
    category,
    images: imageUrl,
    storeId
  }
})
return NextResponse.json({ message: "product added successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

//Get all products for a seller
export async function GET(req) {
    try {
        const { userId } = getAuth(req);
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const products = await prisma.product.findMany({
            where: { storeId }
        });
        return NextResponse.json({ products }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });

    }
} 
