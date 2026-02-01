import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/ip-utils";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Controleer of DATABASE_URL is ingesteld
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        currentCount: 0,
        maxLimit: 10,
        limitType: "quickscan"
      });
    }

    const ipAddress = getClientIp(request);
    
    if (!ipAddress) {
      return NextResponse.json({
        currentCount: 0,
        maxLimit: 10,
        limitType: "quickscan"
      });
    }

    // Probeer het aantal op te halen, maar geef 0 terug als er een error is
    try {
      const quickscanCount = await prisma.quickscan.count({
        where: {
          ipAddress: ipAddress,
        },
      });

      return NextResponse.json({
        currentCount: quickscanCount,
        maxLimit: 10,
        limitType: "quickscan"
      });
    } catch (dbError: any) {
      // Als de database query faalt (bijv. omdat ipAddress kolom nog niet bestaat),
      // geef dan 0 terug in plaats van een error
      console.error("Database error bij ophalen quickscan count:", dbError?.message || dbError);
      
      // Check of het een kolom niet gevonden error is
      if (dbError?.code === 'P2021' || dbError?.message?.includes('column') || dbError?.message?.includes('does not exist')) {
        // Database kolom bestaat nog niet (migratie niet uitgevoerd)
        return NextResponse.json({
          currentCount: 0,
          maxLimit: 10,
          limitType: "quickscan"
        });
      }
      
      return NextResponse.json({
        currentCount: 0,
        maxLimit: 10,
        limitType: "quickscan"
      });
    }
  } catch (error: any) {
    console.error("Error fetching quickscan limit:", error?.message || error);
    // Geef altijd een valide response terug, ook bij errors
    return NextResponse.json({
      currentCount: 0,
      maxLimit: 10,
      limitType: "quickscan"
    });
  }
}
