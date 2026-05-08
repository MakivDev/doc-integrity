import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { hashes } = await request.json();

    if (!hashes || !Array.isArray(hashes)) {
      return NextResponse.json({ error: "An array of hashes is required" }, { status: 400 });
    }

    if (hashes.length === 0) {
      return NextResponse.json({});
    }

    const documents = await prisma.documentMetadata.findMany({
      where: {
        hash: {
          in: hashes,
        },
      },
      select: {
        hash: true,
        filename: true,
      },
    });

    // Convert to a dictionary: { hash: filename }
    const result = documents.reduce((acc, doc) => {
      acc[doc.hash] = doc.filename;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch documents batch:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
