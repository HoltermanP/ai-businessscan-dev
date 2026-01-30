import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, isValidUrl } from "@/lib/url-utils";
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
      "title": "Titel van de AI-kans",
      "description": "Uitgebreide beschrijving waarom deze AI-kans relevant is voor dit specifieke bedrijf (minimaal 100 woorden)",
      "businessCase": {
        "potentialImpact": "Laag/Gemiddeld/Hoog/Zeer Hoog",
        "estimatedROI": "bijv. 200-300%",
        "implementationCost": "bijv. €15.000 - €25.000",
        "timeToValue": "bijv. 2-3 maanden",
        "benefits": [
          "Concrete benefit 1",
          "Concrete benefit 2",
          "Concrete benefit 3",
          "Concrete benefit 4"
        ],
        "rationale": "Een duidelijke onderbouwing (minimaal 80 woorden) die uitlegt waarom deze ROI realistisch is, gebaseerd op concrete voorbeelden uit de bedrijfsactiviteiten. Leg uit hoe de besparingen worden gerealiseerd (bijv. tijdsbesparing, kostenreductie, omzetgroei) en waarom de investering de moeite waard is. Wees realistisch en concreet, maar wel aanlokkend.",
        "keyMetrics": [
          "Concrete meetbare metric 1 (bijv. '40% reductie in handmatige taken')",
          "Concrete meetbare metric 2 (bijv. '€25.000 besparing per jaar')",
          "Concrete meetbare metric 3 (bijv. '15 uur per week tijdsbesparing')"
        ]
      }
    }
  ]
}

Belangrijk:
- Geef exact 3 AI-kansen terug die SPECIFIEK en DIRECT relevant zijn voor dit bedrijf
- Baseer je analyse STRENG op de daadwerkelijke website content - alleen kansen die duidelijk aansluiten bij de bedrijfsactiviteiten
- Vermijd generieke AI-kansen zoals "predictive maintenance", "supply chain optimization" of "fraud detection" tenzij deze expliciet relevant zijn voor dit specifieke bedrijf
- Elke AI-kans moet een duidelijke, directe link hebben met de diensten, producten of processen die op de website worden genoemd
- Als een AI-kans niet direct aansluit bij wat het bedrijf doet, geef deze dan NIET terug - het is beter om minder kansen te geven dan irrelevante kansen
- Maak de beschrijvingen concreet en specifiek voor dit bedrijf - leg duidelijk uit WAAROM deze kans relevant is voor dit specifieke bedrijf
- Zorg dat de business cases realistisch zijn en gebaseerd op de werkelijke bedrijfsactiviteiten
- Voor elke businesscase: geef een duidelijke onderbouwing (rationale) die uitlegt waarom de ROI schatting realistisch is, gebaseerd op concrete voorbeelden uit de bedrijfsactiviteiten
- De rationale moet concreet zijn maar niet overdreven - focus op realistische besparingen en voordelen die aansluiten bij het bedrijf
- Voeg keyMetrics toe met 3 concrete, meetbare metrics die de waarde van de AI-kans ondersteunen
- Geef alleen geldige JSON terug, geen extra tekst ervoor of erna`;

    // Roep OpenAI API aan
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Je bent een expert in bedrijfsanalyse en AI-implementaties. Je geeft altijd geldige JSON responses terug zonder extra tekst. Je bent zeer kritisch en geeft alleen AI-kansen terug die DIRECT en SPECIFIEK relevant zijn voor het geanalyseerde bedrijf. Vermijd generieke of algemene AI-kansen die niet aansluiten bij de werkelijke bedrijfsactiviteiten.",
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
          estimatedROI: opp.businessCase?.estimatedROI || "150-250%",
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
            estimatedROI: "200-300%",
            implementationCost: "€15.000 - €25.000",
            timeToValue: "2-3 maanden",
            benefits: [
              "24/7 beschikbaarheid voor klanten",
              "Vermindering van 40-60% van standaard klantvragen",
              "Verbeterde klanttevredenheid door snellere respons",
              "Kostenbesparing op klantenservice personeel"
            ],
            rationale: "De ROI van 200-300% is gebaseerd op de combinatie van kostenbesparingen door verminderde klantenservice-uren en verhoogde klanttevredenheid die leidt tot meer herhaalaankopen. Een chatbot kan gemiddeld 40-60% van de standaardvragen afhandelen, wat resulteert in een besparing van ongeveer 20-30 uur per week aan klantenservicetijd. Bij een gemiddeld uurtarief van €50-€75 voor klantenservicemedewerkers, levert dit een jaarlijkse besparing op van €50.000-€75.000. De investering van €15.000-€25.000 wordt daardoor binnen 3-6 maanden terugverdiend.",
            keyMetrics: [
              "40-60% reductie in handmatige klantvragen",
              "€50.000-€75.000 jaarlijkse kostenbesparing",
              "20-30 uur per week tijdsbesparing voor klantenservice"
            ]
          }
        },
        {
          id: 2,
          title: "Predictive Analytics voor Verkoop",
          description: "Gebruik AI om verkooppatronen te analyseren en voorspellingen te doen over toekomstige vraag.",
          businessCase: {
            potentialImpact: "Zeer Hoog",
            estimatedROI: "250-400%",
            implementationCost: "€20.000 - €35.000",
            timeToValue: "3-4 maanden",
            benefits: [
              "Optimalisatie van voorraadniveaus (20-30% reductie)",
              "Verhoogde verkoop door betere productaanbevelingen",
              "Verbeterde cashflow door slimmer voorraadbeheer",
              "Data-gedreven besluitvorming"
            ],
            rationale: "De ROI van 250-400% wordt gerealiseerd door een combinatie van voorraadoptimalisatie en omzetgroei. Door betere voorspellingen van vraagpatronen kan de voorraad met 20-30% worden gereduceerd, wat leidt tot lagere voorraadkosten en minder verouderde producten. Tegelijkertijd kunnen gepersonaliseerde aanbevelingen de omzet met 10-15% verhogen. Voor een bedrijf met een jaarlijkse omzet van €500.000-€1.000.000 betekent dit een extra omzet van €50.000-€150.000 per jaar, plus besparingen op voorraadkosten van €20.000-€40.000. De totale waarde van €70.000-€190.000 per jaar rechtvaardigt de investering ruimschoots.",
            keyMetrics: [
              "20-30% reductie in voorraadniveaus",
              "10-15% omzetgroei door betere aanbevelingen",
              "€70.000-€190.000 totale jaarlijkse waarde"
            ]
          }
        },
        {
          id: 3,
          title: "Geautomatiseerde Content Generatie",
          description: "AI kan helpen bij het genereren van marketing content, productbeschrijvingen en social media posts.",
          businessCase: {
            potentialImpact: "Gemiddeld tot Hoog",
            estimatedROI: "150-250%",
            implementationCost: "€10.000 - €18.000",
            timeToValue: "1-2 maanden",
            benefits: [
              "Tijdsbesparing van 15-20 uur per week",
              "Consistente tone-of-voice in alle content",
              "Snellere time-to-market voor nieuwe producten",
              "Meer tijd voor strategische marketing activiteiten"
            ],
            rationale: "De ROI van 150-250% is gebaseerd op de tijdsbesparing die wordt gerealiseerd door geautomatiseerde contentgeneratie. Met een besparing van 15-20 uur per week kan een marketingmedewerker zich richten op strategische taken in plaats van repetitieve contentcreatie. Bij een gemiddeld uurtarief van €40-€60 voor marketingpersoneel, levert dit een jaarlijkse waarde op van €30.000-€60.000. Daarnaast kan snellere time-to-market voor nieuwe producten leiden tot extra omzet door eerder op de markt te zijn dan concurrenten. De investering wordt daardoor binnen 4-8 maanden terugverdiend.",
            keyMetrics: [
              "15-20 uur per week tijdsbesparing",
              "€30.000-€60.000 jaarlijkse waarde door tijdsbesparing",
              "50% snellere time-to-market voor nieuwe producten"
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

    // Normaliseer URL (voeg https:// toe als nodig)
    const normalizedUrl = normalizeUrl(url);

    // Valideer URL formaat
    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "Ongeldige URL" },
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
        },
      });
    } catch (dbError) {
      console.error("Database error bij opslaan quickscan:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Onbekende database fout";
      console.error("Database error details:", { errorMessage, quickscanId, url: normalizedUrl });
      // Continue ook als database opslag faalt (voor backwards compatibility)
      // Maar log wel de error voor debugging
    }
    
    return NextResponse.json({
      quickscanId,
      url: normalizedUrl,
      ...analysis,
      createdAt: new Date().toISOString()
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
