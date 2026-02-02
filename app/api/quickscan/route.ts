import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, isValidUrl, isWebsiteReachable } from "@/lib/url-utils";
import { getClientIp } from "@/lib/ip-utils";
import OpenAI from "openai";
import { prisma } from "@/lib/db";

// Initialiseer OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Haal website content op
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10 seconden timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract tekstuele content (simpele extractie - verwijder HTML tags)
    // In productie zou je een betere HTML parser gebruiken zoals cheerio
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Verwijder scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Verwijder styles
      .replace(/<[^>]+>/g, ' ') // Verwijder alle HTML tags
      .replace(/\s+/g, ' ') // Normaliseer whitespace
      .trim()
      .substring(0, 8000); // Limiteer tot 8000 karakters voor OpenAI

    return textContent || `Website: ${url}`;
  } catch (error) {
    console.error("Error fetching website content:", error);
    // Fallback: gebruik alleen de URL
    return `Website URL: ${url}`;
  }
}

// Analyseer website met OpenAI
async function analyzeWebsite(url: string) {
  try {
    // Haal website content op
    const websiteContent = await fetchWebsiteContent(url);
    const domain = new URL(url).hostname.replace('www.', '');

    // Maak een prompt voor OpenAI
    const prompt = `Je bent een expert in bedrijfsanalyse en AI-implementaties. Analyseer de volgende website content en geef een gedetailleerde analyse terug in JSON formaat.

Website URL: ${url}
Website Content (eerste 8000 karakters):
${websiteContent}

Geef een JSON response terug met het volgende formaat:
{
  "companyDescription": "Een uitgebreide beschrijving van het bedrijf op basis van de website content, inclusief diensten, doelgroep en marktpositie (minimaal 150 woorden)",
  "aiOpportunities": [
    {
      "id": 1,
      "title": "Titel van de AI-kans - specifiek voor dit bedrijf",
      "description": "KORTE maar BEDRIJFSSPECIFIEKE beschrijving (60-80 woorden) die direct uitlegt waarom deze AI-kans relevant is voor dit specifieke bedrijf. Verwijs naar concrete diensten, producten of processen die op de website worden genoemd. Wees concreet en specifiek - geen generieke beschrijvingen.",
      "businessCase": {
        "potentialImpact": "Laag/Gemiddeld/Hoog/Zeer Hoog",
        "estimatedROI": "bijv. 50-120%",
        "implementationCost": "bijv. €15.000 - €25.000",
        "timeToValue": "bijv. 2-3 maanden",
        "benefits": [
          "Concrete benefit 1 - specifiek voor dit bedrijf",
          "Concrete benefit 2 - specifiek voor dit bedrijf",
          "Concrete benefit 3 - specifiek voor dit bedrijf",
          "Concrete benefit 4 - specifiek voor dit bedrijf"
        ],
        "rationale": "Een duidelijke onderbouwing (minimaal 80 woorden) die uitlegt waarom deze ROI realistisch is, gebaseerd op concrete voorbeelden uit de bedrijfsactiviteiten. Leg uit hoe de besparingen worden gerealiseerd (bijv. tijdsbesparing, kostenreductie, omzetgroei) en waarom de investering de moeite waard is. Verwijs naar specifieke aspecten van dit bedrijf zoals genoemd op de website. Wees REALISTISCH en CONSERVATIEF - geen overdreven optimistische schattingen. Focus op concrete, haalbare besparingen en voordelen.",
        "keyMetrics": [
          "Concrete meetbare metric 1 (bijv. '40% reductie in handmatige taken')",
          "Concrete meetbare metric 2 (bijv. '€25.000 besparing per jaar')",
          "Concrete meetbare metric 3 (bijv. '15 uur per week tijdsbesparing')"
        ]
      }
    }
  ]
}

KRITIEKE INSTRUCTIES VOOR BEDRIJFSSPECIFIEKE OPLOSSINGEN:
- Geef exact 3 AI-kansen terug die EXTREEM SPECIFIEK en DIRECT relevant zijn voor dit bedrijf
- Baseer je analyse STRENG op de daadwerkelijke website content - alleen kansen die duidelijk aansluiten bij de bedrijfsactiviteiten
- Vermijd generieke AI-kansen zoals "predictive maintenance", "supply chain optimization" of "fraud detection" tenzij deze expliciet relevant zijn voor dit specifieke bedrijf
- Elke AI-kans moet een duidelijke, directe link hebben met de diensten, producten of processen die op de website worden genoemd
- Als een AI-kans niet direct aansluit bij wat het bedrijf doet, geef deze dan NIET terug - het is beter om minder kansen te geven dan irrelevante kansen
- Maak de beschrijvingen EXTREEM concreet en specifiek voor dit bedrijf - verwijs naar specifieke diensten, producten, processen of doelgroepen zoals genoemd op de website
- Gebruik de bedrijfsnaam, diensten en producten uit de website content in je beschrijvingen
- Zorg dat de business cases REALISTISCH en CONSERVATIEF zijn - ROI moet tussen 50-120% liggen, niet hoger
- Voor elke businesscase: geef een duidelijke onderbouwing (rationale) die uitlegt waarom de ROI schatting realistisch is, gebaseerd op concrete voorbeelden uit de bedrijfsactiviteiten
- De rationale moet concreet zijn maar NIET overdreven - focus op realistische, haalbare besparingen en voordelen die aansluiten bij het specifieke bedrijf
- Wees CONSERVATIEF met ROI schattingen - 50-120% is realistisch, niet 200-400%
- Voeg keyMetrics toe met 3 concrete, meetbare metrics die de waarde van de AI-kans ondersteunen en specifiek zijn voor dit bedrijf
- De beschrijving moet KORT zijn (60-80 woorden) maar wel BEDRIJFSSPECIFIEK - geen generieke tekst
- Geef alleen geldige JSON terug, geen extra tekst ervoor of erna`;

    // Roep OpenAI API aan
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Je bent een expert in bedrijfsanalyse en AI-implementaties. Je geeft altijd geldige JSON responses terug zonder extra tekst. Je bent zeer kritisch en geeft alleen AI-kansen terug die DIRECT en EXTREEM SPECIFIEK relevant zijn voor het geanalyseerde bedrijf. Vermijd generieke of algemene AI-kansen die niet aansluiten bij de werkelijke bedrijfsactiviteiten. BELANGRIJK: ROI schattingen moeten REALISTISCH en CONSERVATIEF zijn (50-120%, niet hoger). Alle beschrijvingen moeten concreet verwijzen naar specifieke diensten, producten of processen zoals genoemd op de website.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Geen response van OpenAI");
    }

    // Parse JSON response
    const analysis = JSON.parse(responseContent);

    // Valideer en structureer de response
    return {
      companyDescription: analysis.companyDescription || `Bedrijf ${domain} is een innovatief bedrijf dat actief is in de digitale markt.`,
      aiOpportunities: (analysis.aiOpportunities || []).slice(0, 3).map((opp: any, index: number) => ({
        id: opp.id || index + 1,
        title: opp.title || `AI Kans ${index + 1}`,
        description: opp.description || "",
        businessCase: {
          potentialImpact: opp.businessCase?.potentialImpact || "Gemiddeld",
          estimatedROI: opp.businessCase?.estimatedROI || "50-120%",
          implementationCost: opp.businessCase?.implementationCost || "€10.000 - €20.000",
          timeToValue: opp.businessCase?.timeToValue || "2-3 maanden",
          benefits: opp.businessCase?.benefits || [],
          rationale: opp.businessCase?.rationale || "Deze AI-kans biedt concrete voordelen voor het bedrijf door automatisering en optimalisatie van processen.",
          keyMetrics: opp.businessCase?.keyMetrics || [],
        },
      })),
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    
    // Fallback naar mock data als OpenAI faalt
    const domain = new URL(url).hostname.replace('www.', '');
    const companyName = domain.split('.')[0];

    return {
      companyDescription: `Bedrijf ${companyName} is een innovatief bedrijf dat actief is in de digitale markt. Op basis van de website analyse kunnen we zien dat het bedrijf zich richt op het leveren van hoogwaardige diensten aan zowel B2B als B2C klanten.`,
      aiOpportunities: [
        {
          id: 1,
          title: "Chatbot voor Klantenservice",
          description: "Implementeer een AI-gestuurde chatbot die 24/7 klantvragen kan beantwoorden, reserveringen kan verwerken en algemene informatie kan verstrekken.",
          businessCase: {
            potentialImpact: "Hoog",
            estimatedROI: "60-100%",
            implementationCost: "€15.000 - €25.000",
            timeToValue: "2-3 maanden",
            benefits: [
              "24/7 beschikbaarheid voor klanten",
              "Vermindering van 30-50% van standaard klantvragen",
              "Verbeterde klanttevredenheid door snellere respons",
              "Kostenbesparing op klantenservice personeel"
            ],
            rationale: "De ROI van 60-100% is gebaseerd op realistische kostenbesparingen door verminderde klantenservice-uren. Een chatbot kan gemiddeld 30-50% van de standaardvragen afhandelen, wat resulteert in een besparing van ongeveer 10-15 uur per week aan klantenservicetijd. Bij een gemiddeld uurtarief van €40-€60 voor klantenservicemedewerkers, levert dit een jaarlijkse besparing op van €20.000-€35.000. De investering van €15.000-€25.000 wordt daardoor binnen 6-12 maanden terugverdiend.",
            keyMetrics: [
              "30-50% reductie in handmatige klantvragen",
              "€20.000-€35.000 jaarlijkse kostenbesparing",
              "10-15 uur per week tijdsbesparing voor klantenservice"
            ]
          }
        },
        {
          id: 2,
          title: "Predictive Analytics voor Verkoop",
          description: "Gebruik AI om verkooppatronen te analyseren en voorspellingen te doen over toekomstige vraag.",
          businessCase: {
            potentialImpact: "Hoog",
            estimatedROI: "70-110%",
            implementationCost: "€20.000 - €35.000",
            timeToValue: "3-4 maanden",
            benefits: [
              "Optimalisatie van voorraadniveaus (15-25% reductie)",
              "Verhoogde verkoop door betere productaanbevelingen",
              "Verbeterde cashflow door slimmer voorraadbeheer",
              "Data-gedreven besluitvorming"
            ],
            rationale: "De ROI van 70-110% wordt gerealiseerd door een combinatie van voorraadoptimalisatie en omzetgroei. Door betere voorspellingen van vraagpatronen kan de voorraad met 15-25% worden gereduceerd, wat leidt tot lagere voorraadkosten. Tegelijkertijd kunnen gepersonaliseerde aanbevelingen de omzet met 5-10% verhogen. Voor een bedrijf met een jaarlijkse omzet van €500.000-€1.000.000 betekent dit een extra omzet van €25.000-€75.000 per jaar, plus besparingen op voorraadkosten van €15.000-€30.000. De totale waarde van €40.000-€105.000 per jaar rechtvaardigt de investering.",
            keyMetrics: [
              "15-25% reductie in voorraadniveaus",
              "5-10% omzetgroei door betere aanbevelingen",
              "€40.000-€105.000 totale jaarlijkse waarde"
            ]
          }
        },
        {
          id: 3,
          title: "Geautomatiseerde Content Generatie",
          description: "AI kan helpen bij het genereren van marketing content, productbeschrijvingen en social media posts.",
          businessCase: {
            potentialImpact: "Gemiddeld tot Hoog",
            estimatedROI: "50-90%",
            implementationCost: "€10.000 - €18.000",
            timeToValue: "1-2 maanden",
            benefits: [
              "Tijdsbesparing van 10-15 uur per week",
              "Consistente tone-of-voice in alle content",
              "Snellere time-to-market voor nieuwe producten",
              "Meer tijd voor strategische marketing activiteiten"
            ],
            rationale: "De ROI van 50-90% is gebaseerd op de tijdsbesparing die wordt gerealiseerd door geautomatiseerde contentgeneratie. Met een besparing van 10-15 uur per week kan een marketingmedewerker zich richten op strategische taken in plaats van repetitieve contentcreatie. Bij een gemiddeld uurtarief van €40-€50 voor marketingpersoneel, levert dit een jaarlijkse waarde op van €20.000-€35.000. De investering wordt daardoor binnen 6-12 maanden terugverdiend.",
            keyMetrics: [
              "10-15 uur per week tijdsbesparing",
              "€20.000-€35.000 jaarlijkse waarde door tijdsbesparing",
              "30-40% snellere time-to-market voor nieuwe producten"
            ]
          }
        }
      ]
    };
  }
}

export async function POST(request: NextRequest) {
  let url: string | undefined;
  
  try {
    const body = await request.json();
    url = body.url;

    if (!url) {
      return NextResponse.json(
        { error: "URL is verplicht" },
        { status: 400 }
      );
    }

    // Haal IP-adres op voor limiet tracking
    const ipAddress = getClientIp(request);
    
    // Controleer limiet voor quickscans (max 5 totaal per IP)
    if (ipAddress) {
      const quickscanCount = await prisma.quickscan.count({
        where: {
          ipAddress: ipAddress,
        },
      });

      if (quickscanCount >= 5) {
        return NextResponse.json(
          { 
            error: "Limiet bereikt",
            message: "Je hebt je limiet van 5 gratis quickscans bereikt. Wil je meer gratis credits? Stuur een email naar businessscan@ai-group.nl met je verzoek.",
            limitReached: true,
            limitType: "quickscan",
            maxLimit: 5,
            currentCount: quickscanCount
          },
          { status: 429 } // 429 = Too Many Requests
        );
      }
    }

    // Normaliseer URL (voeg https:// toe als nodig)
    const normalizedUrl = normalizeUrl(url);

    // Valideer URL formaat
    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "Ongeldige URL" },
        { status: 400 }
      );
    }

    // Controleer of de website bereikbaar is
    const reachabilityCheck = await isWebsiteReachable(normalizedUrl);
    if (!reachabilityCheck.reachable) {
      return NextResponse.json(
        { error: reachabilityCheck.error || "Website is niet bereikbaar. Controleer of de URL correct is en of de website online is." },
        { status: 400 }
      );
    }

    // Analyseer de website
    const analysis = await analyzeWebsite(normalizedUrl);

    // Genereer een unieke quickscan ID
    const quickscanId = `quickscan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Sla quickscan op in database
    try {
      await prisma.quickscan.create({
        data: {
          quickscanId,
          url: normalizedUrl,
          companyDescription: analysis.companyDescription,
          aiOpportunities: analysis.aiOpportunities,
          ipAddress, // Sla IP-adres op voor limiet tracking
        },
      });
    } catch (dbError) {
      console.error("Database error bij opslaan quickscan:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Onbekende database fout";
      console.error("Database error details:", { errorMessage, quickscanId, url: normalizedUrl });
      // Continue ook als database opslag faalt (voor backwards compatibility)
      // Maar log wel de error voor debugging
    }
    
    // Haal het aantal quickscans op voor deze IP (na het opslaan)
    let currentCount = 0;
    if (ipAddress) {
      currentCount = await prisma.quickscan.count({
        where: {
          ipAddress: ipAddress,
        },
      });
    }

    return NextResponse.json({
      quickscanId,
      url: normalizedUrl,
      ...analysis,
      createdAt: new Date().toISOString(),
      scanCount: {
        current: currentCount,
        max: 5,
        limitType: "quickscan"
      }
    });
  } catch (error) {
    console.error("Quickscan error:", error);
    const errorMessage = error instanceof Error ? error.message : "Onbekende fout";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, url });
    
    return NextResponse.json(
      { 
        error: "Er is een fout opgetreden bij het uitvoeren van de quickscan",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
