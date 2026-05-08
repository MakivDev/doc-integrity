import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { hash, filename } = await request.json();

    if (!hash || !filename) {
      return NextResponse.json({ error: "Hash and filename are required" }, { status: 400 });
    }

    const document = await prisma.documentMetadata.upsert({
      where: { hash },
      update: { filename },
      create: { hash, filename },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Failed to save document metadata:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
