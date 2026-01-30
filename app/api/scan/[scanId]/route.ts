import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const { scanId } = await params;
    
    const scan = await prisma.scan.findUnique({
      where: { scanId },
    });

    if (!scan) {
      return NextResponse.json(
        { error: "Scan niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      scanId: scan.scanId,
      url: scan.url,
      companyDescription: scan.companyDescription,
      aiOpportunities: scan.aiOpportunities as any,
      createdAt: scan.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching scan:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
