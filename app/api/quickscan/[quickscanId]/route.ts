import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quickscanId: string }> }
) {
  let quickscanId: string | undefined;
  
  try {
    const resolvedParams = await params;
    quickscanId = resolvedParams.quickscanId;
    
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
    const errorMessage = error instanceof Error ? error.message : "Onbekende fout";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, quickscanId });
    
    return NextResponse.json(
      { 
        error: "Er is een fout opgetreden bij het ophalen van de quickscan",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
