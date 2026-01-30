import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quickscanId: string }> }
) {
  try {
    const { quickscanId } = await params;
    
    const quickscan = await prisma.quickscan.findUnique({
      where: { quickscanId },
    });

    if (!quickscan) {
      return NextResponse.json(
        { error: "Quickscan niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      quickscanId: quickscan.quickscanId,
      url: quickscan.url,
      companyDescription: quickscan.companyDescription,
      aiOpportunities: quickscan.aiOpportunities as any,
      createdAt: quickscan.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching quickscan:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
