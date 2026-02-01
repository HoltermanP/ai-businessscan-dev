import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Controleer of DATABASE_URL is ingesteld
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        currentCount: 0,
        maxLimit: 5,
        limitType: "fullscan"
      });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        currentCount: 0,
        maxLimit: 5,
        limitType: "fullscan"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Probeer het aantal op te halen, maar geef 0 terug als er een error is
    try {
      const fullScanCount = await prisma.fullQuickscan.count({
        where: {
          email: normalizedEmail,
        },
      });

      return NextResponse.json({
        currentCount: fullScanCount,
        maxLimit: 5,
        limitType: "fullscan"
      });
    } catch (dbError: any) {
      // Als de database query faalt, geef dan 0 terug in plaats van een error
      console.error("Database error bij ophalen full scan count:", dbError?.message || dbError);
      
      // Check of het een kolom niet gevonden error is
      if (dbError?.code === 'P2021' || dbError?.message?.includes('column') || dbError?.message?.includes('does not exist')) {
        // Database kolom bestaat nog niet (migratie niet uitgevoerd)
        return NextResponse.json({
          currentCount: 0,
          maxLimit: 5,
          limitType: "fullscan"
        });
      }
      
      return NextResponse.json({
        currentCount: 0,
        maxLimit: 5,
        limitType: "fullscan"
      });
    }
  } catch (error: any) {
    console.error("Error fetching full scan limit:", error?.message || error);
    // Geef altijd een valide response terug, ook bij errors
    return NextResponse.json({
      currentCount: 0,
      maxLimit: 5,
      limitType: "fullscan"
    });
  }
}
