import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import imagekit from "@/configs/imagekit";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    // 🔒 Check auth
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📦 Get form data
    const formData = await req.formData();
    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    // ❗ Validate fields
    if (!name || !username || !description || !email || !contact || !address) {
      return NextResponse.json({ error: "Missing store info" }, { status: 400 });
    }

    if (!image || !image.name) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // 🔥 IMPORTANT: Ensure user exists in DB (FIX for P2003)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "New User",
        email,
        image: "default"
      }
    });

    // ❗ Check if store already exists
    const existingStore = await prisma.store.findFirst({
      where: { userId }
    });

    if (existingStore) {
      return NextResponse.json({ status: existingStore.status });
    }

    // ❗ Check username uniqueness
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() }
    });

    if (isUsernameTaken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // 🖼 Upload image to ImageKit
    const buffer = Buffer.from(await image.arrayBuffer());

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos"
    });

    const optimizedLogo = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" }
      ]
    });

    // 🏪 Create store
    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedLogo
      }
    });

    // 🔗 Connect store to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        store: {
          connect: { id: newStore.id }
        }
      }
    });

    return NextResponse.json(
      { message: "Applied, waiting for approval!" },
      { status: 200 }
    );

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
// /app/api/store/create/route.js
export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // find the store for this user
  const store = await prisma.store.findFirst({
    where: { userId },
  });

  if (!store) {
    return NextResponse.json({ status: "none" }); // user has no store yet
  }

  return NextResponse.json({ status: store.status });
}