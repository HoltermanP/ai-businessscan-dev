import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { normalizeUrl, isValidUrl, isWebsiteReachable } from "@/lib/url-utils";
import OpenAI from "openai";
import { prisma } from "@/lib/db";

// Initialiseer nodemailer transporter (gebruik environment variables in productie)
const createTransporter = () => {
  // Als SMTP configuratie niet is ingesteld, retourneer null
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true voor 465, false voor andere poorten
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

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
      "description": "UITGEBREIDE en BEDRIJFSSPECIFIEKE beschrijving (minimaal 150 woorden) die diepgaand uitlegt waarom deze AI-kans relevant is voor dit specifieke bedrijf. Verwijs naar concrete diensten, producten, processen, doelgroepen of uitdagingen die op de website worden genoemd. Leg uit hoe deze AI-kans specifiek aansluit bij de bedrijfsactiviteiten en wat de unieke voordelen zijn voor dit bedrijf.",
      "businessCase": {
        "potentialImpact": "Laag/Gemiddeld/Hoog/Zeer Hoog",
        "estimatedROI": "bijv. 200-300%",
        "implementationCost": "bijv. €15.000 - €25.000",
        "timeToValue": "bijv. 2-3 maanden",
        "benefits": [
          "Concrete benefit 1 - specifiek voor dit bedrijf",
          "Concrete benefit 2 - specifiek voor dit bedrijf",
          "Concrete benefit 3 - specifiek voor dit bedrijf",
          "Concrete benefit 4 - specifiek voor dit bedrijf"
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
- Maak de beschrijvingen UITGEBREID (minimaal 150 woorden) en EXTREEM concreet en specifiek voor dit bedrijf - verwijs naar specifieke diensten, producten, processen of doelgroepen zoals genoemd op de website
- Gebruik de bedrijfsnaam, diensten en producten uit de website content in je beschrijvingen
- Zorg dat de business cases realistisch zijn en gebaseerd op de werkelijke bedrijfsactiviteiten zoals beschreven op de website
- Geef alleen geldige JSON terug, geen extra tekst ervoor of erna`;

    // Roep OpenAI API aan (gebruik gpt-4o voor uitgebreide rapporten)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Je bent een expert in bedrijfsanalyse en AI-implementaties. Je geeft altijd geldige JSON responses terug zonder extra tekst. Je bent zeer kritisch en geeft alleen AI-kansen terug die DIRECT en EXTREEM SPECIFIEK relevant zijn voor het geanalyseerde bedrijf. Vermijd generieke of algemene AI-kansen die niet aansluiten bij de werkelijke bedrijfsactiviteiten. Alle beschrijvingen moeten concreet verwijzen naar specifieke diensten, producten of processen zoals genoemd op de website.",
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
            ]
          }
        }
      ]
    };
  }
}

// Genereer uitgebreide analyse met OpenAI gpt-4o
async function generateFullAnalysis(url: string, basicAnalysis: any) {
  try {
    const prompt = `Je bent een expert in bedrijfsanalyse en AI-implementaties. Je schrijft dit rapport als een VOORSTEL van AI-Group, een gespecialiseerd AI-implementatiebedrijf. AI-Group helpt bedrijven met het implementeren van AI-oplossingen door middel van consultancy, ontwikkeling, implementatie en ondersteuning.

Op basis van de volgende basis analyse, genereer een BEDRIJFSSPECIFIEK VOORSTEL in JSON formaat dat duidelijk maakt dat AI-Group deze oplossingen kan implementeren.

BELANGRIJK: Geef ALLE 3 AI-kansen terug uit de basis analyse. Zorg dat elke kans een complete uitwerking krijgt.

Website URL: ${url}
Bedrijfsbeschrijving: ${basicAnalysis.companyDescription}

AI Kansen:
${JSON.stringify(basicAnalysis.aiOpportunities, null, 2)}

Geef een JSON response terug met het volgende formaat:
{
  "executiveSummary": "Een beknopte bestuurlijke samenvatting (100-150 woorden) geschreven als VOORSTEL van AI-Group. Positioneer AI-Group als de implementatiepartner die deze oplossingen kan realiseren. Leg kort uit wat AI-Group kan betekenen voor dit specifieke bedrijf en verwijs naar de concrete kansen.",
  "detailedOpportunities": [
    {
      "id": 1,
      "title": "Titel van de AI-kans (specifiek voor dit bedrijf)",
      "description": "Beknopte maar BEDRIJFSSPECIFIEKE beschrijving (80-120 woorden) die uitlegt waarom deze AI-kans relevant is voor dit specifieke bedrijf. Verwijs naar concrete diensten, producten of processen. Wees concreet en specifiek.",
      "businessCase": {
        "potentialImpact": "...",
        "estimatedROI": "...",
        "implementationCost": "...",
        "timeToValue": "...",
        "benefits": [...]
      },
      "implementationPlan": {
        "phase1": {
          "title": "Fase 1 titel (specifiek voor deze AI-kans)",
          "duration": "bijv. 2-3 weken",
          "activities": ["activiteit 1 - specifiek", "activiteit 2 - specifiek", "activiteit 3 - specifiek"]
        },
        "phase2": {
          "title": "Fase 2 titel (specifiek voor deze AI-kans)",
          "duration": "gebruik timeToValue uit businessCase",
          "activities": ["activiteit 1 - specifiek", "activiteit 2 - specifiek", "activiteit 3 - specifiek"]
        },
        "phase3": {
          "title": "Fase 3 titel (specifiek voor deze AI-kans)",
          "duration": "bijv. 4-6 weken",
          "activities": ["activiteit 1 - specifiek", "activiteit 2 - specifiek"]
        }
      },
      "detailedBusinessCase": {
        "potentialImpact": "...",
        "estimatedROI": "...",
        "implementationCost": "...",
        "timeToValue": "...",
        "benefits": [...],
        "financialProjection": {
          "year1": {
            "investment": "gebruik implementationCost",
            "expectedSavings": "REALISTISCHE schatting gebaseerd op de specifieke AI-kans (bijv. '€15.000 - €30.000') - wees conservatief en realistisch",
            "expectedRevenueIncrease": "REALISTISCHE schatting van omzetgroei indien van toepassing (bijv. '€5.000 - €15.000') - wees conservatief",
            "totalValue": "totale waarde (expectedSavings + expectedRevenueIncrease)",
            "roi": "REALISTISCHE ROI (bijv. '50-120%') - wees conservatief en realistisch, niet te optimistisch",
            "breakEvenPoint": "bijv. '6-12 maanden' - realistisch",
            "summary": "Korte uitleg (40-60 woorden) van hoe de besparingen en omzetgroei worden gerealiseerd, specifiek voor dit bedrijf"
          }
        },
        "riskAnalysis": {
          "technicalRisks": ["risico 1 - specifiek", "risico 2 - specifiek"],
          "businessRisks": ["risico 1 - specifiek", "risico 2 - specifiek"],
          "mitigations": ["mitigatie 1 - specifiek", "mitigatie 2 - specifiek"]
        }
      },
      "technicalRequirements": ["vereiste 1 - specifiek", "vereiste 2 - specifiek", "vereiste 3 - specifiek"],
      "successMetrics": ["metric 1 - specifiek", "metric 2 - specifiek", "metric 3 - specifiek"],
      "aiGroupApproach": {
        "whatWeDo": "Beknopte beschrijving (60-80 woorden) van WAT AI-Group doet voor deze AI-kans. Leg concreet uit welke diensten AI-Group levert en wat AI-Group gaat implementeren.",
        "howWeDoIt": "Beknopte beschrijving (60-80 woorden) van HOE AI-Group deze oplossing aanpakt. Leg kort uit welke methodologie AI-Group gebruikt en hoe AI-Group samenwerkt met het bedrijf.",
        "whyChooseUs": "Beknopte beschrijving (50-70 woorden) van WAAROM dit bedrijf voor AI-Group moet kiezen. Leg kort uit wat AI-Group uniek maakt."
      }
    }
  ],
  "overallRecommendation": "Een beknopte aanbeveling (100-150 woorden) geschreven als VOORSTEL van AI-Group. Adviseer welke AI-kans als eerste geïmplementeerd moet worden en waarom, specifiek voor dit bedrijf. Leg kort uit waarom AI-Group de juiste partner is.",
  "nextSteps": ["stap 1 - specifiek", "stap 2 - specifiek", "stap 3 - specifiek", "stap 4 - specifiek"]
}

KRITIEKE INSTRUCTIES:
- BELANGRIJK: Geef ALLE 3 AI-kansen terug uit de basis analyse - elke kans moet een complete uitwerking krijgen
- Schrijf het rapport als een VOORSTEL van AI-Group - positioneer AI-Group duidelijk als de implementatiepartner
- Wees BEKNOPT: beschrijvingen moeten 80-120 woorden zijn, niet 200+ woorden
- Wees REALISTISCH: ROI schattingen moeten conservatief zijn (50-120% is realistisch, niet 200-400%)
- Financiële projecties moeten REALISTISCH en CONSERVATIEF zijn - wees niet te optimistisch
- Geef alleen jaar 1 financiële projectie - geen uitgebreide 3-jaar projecties
- Implementatieplan: 3 fasen met elk 2-3 activiteiten (niet 4+)
- Alle beschrijvingen moeten specifiek zijn voor dit bedrijf - geen generieke voorbeelden
- De businesscase moet overtuigend zijn maar gebaseerd op REALISTISCHE aannames
- Geef alleen geldige JSON terug, geen extra tekst`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Je bent een expert in bedrijfsanalyse en AI-implementaties. Je schrijft voorstellen namens AI-Group, een gespecialiseerd AI-implementatiebedrijf. Je geeft altijd geldige JSON responses terug zonder extra tekst. Je bent zeer kritisch en zorgt ervoor dat alle details specifiek en relevant zijn voor het geanalyseerde bedrijf. BELANGRIJK: Geef ALLE 3 AI-kansen terug met complete uitwerking. Wees BEKNOPT (80-120 woorden per beschrijving) en REALISTISCH (ROI 50-120%, niet te optimistisch). Financiële projecties moeten conservatief zijn en alleen jaar 1 bevatten. Alle beschrijvingen moeten concreet verwijzen naar specifieke diensten, producten of processen zoals genoemd in de bedrijfsbeschrijving. Positioneer AI-Group duidelijk als de implementatiepartner die deze oplossingen kan realiseren.",
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

    const fullAnalysis = JSON.parse(responseContent);

    // Valideer en structureer de response
    // Zorg ervoor dat alle 3 oplossingen worden getoond
    const allOpportunities = basicAnalysis.aiOpportunities || [];
    const detailedOpps = fullAnalysis.detailedOpportunities || [];
    
    // Merge de basis opportunities met de detailed opportunities
    // Als er minder detailed opportunities zijn dan basis opportunities, gebruik dan de basis opportunities
    const mergedOpportunities = allOpportunities.map((baseOpp: any, index: number) => {
      const detailedOpp = detailedOpps[index] || {};
      return {
        ...baseOpp,
        ...detailedOpp,
        id: detailedOpp.id || baseOpp.id || index + 1,
        title: detailedOpp.title || baseOpp.title || `AI Kans ${index + 1}`,
        description: detailedOpp.description || baseOpp.description || "",
        implementationPlan: detailedOpp.implementationPlan || {
          phase1: { title: "Voorbereiding", duration: "2-3 weken", activities: [] },
          phase2: { title: "Implementatie", duration: baseOpp.businessCase?.timeToValue || "2-3 maanden", activities: [] },
          phase3: { title: "Lancering", duration: "4-6 weken", activities: [] },
        },
        detailedBusinessCase: {
          ...baseOpp.businessCase,
          ...detailedOpp.detailedBusinessCase,
          financialProjection: detailedOpp.detailedBusinessCase?.financialProjection || {
            year1: {
              investment: baseOpp.businessCase?.implementationCost || "€10.000 - €20.000",
              expectedSavings: "€15.000 - €30.000",
              expectedRevenueIncrease: "€5.000 - €15.000",
              totalValue: "€20.000 - €45.000",
              roi: baseOpp.businessCase?.estimatedROI || "50-120%",
              breakEvenPoint: "6-12 maanden",
              summary: "Kostenbesparingen worden gerealiseerd door automatisering en optimalisatie. Omzetgroei wordt gerealiseerd door verbeterde service."
            }
          },
          riskAnalysis: detailedOpp.detailedBusinessCase?.riskAnalysis || { technicalRisks: [], businessRisks: [], mitigations: [] },
        },
        technicalRequirements: detailedOpp.technicalRequirements || [],
        successMetrics: detailedOpp.successMetrics || [],
        aiGroupApproach: detailedOpp.aiGroupApproach || {
          whatWeDo: "AI-Group implementeert deze AI-oplossing door middel van consultancy, ontwikkeling en implementatie. We zorgen voor een op maat gemaakte oplossing die perfect aansluit bij uw bedrijfsprocessen.",
          howWeDoIt: "AI-Group gebruikt een bewezen methodologie met gefaseerde implementatie. We werken nauw samen met uw team, zorgen voor training en ondersteuning, en garanderen een succesvolle implementatie.",
          whyChooseUs: "AI-Group heeft uitgebreide ervaring met AI-implementaties en combineert technische expertise met diepgaande kennis van bedrijfsprocessen. We zorgen voor een oplossing die direct waarde toevoegt aan uw bedrijf.",
        },
      };
    });
    
    return {
      executiveSummary: fullAnalysis.executiveSummary || "Uitgebreide analyse van AI-implementatiemogelijkheden.",
      detailedOpportunities: mergedOpportunities,
      overallRecommendation: fullAnalysis.overallRecommendation || `Wij adviseren om te starten met ${basicAnalysis.aiOpportunities[0]?.title || "de eerste AI-kans"}.`,
      nextSteps: fullAnalysis.nextSteps || [
        "Neem contact op met AI-Group voor een vrijblijvend gesprek",
        "Plan een strategie sessie met AI-Group om prioriteiten te bepalen",
        "AI-Group bereidt een gedetailleerd projectplan voor",
        "Identificeer interne stakeholders voor samenwerking met AI-Group",
        "Start de samenwerking met AI-Group voor implementatie",
      ],
    };
  } catch (error) {
    console.error("OpenAI full analysis error:", error);
    
    // Fallback naar basis structuur als OpenAI faalt
    return {
      executiveSummary: `
        AI-Group heeft een uitgebreide analyse uitgevoerd van de AI-implementatiemogelijkheden 
        voor uw bedrijf. Op basis van de website analyse en marktonderzoek hebben we drie 
        strategische AI-kansen geïdentificeerd die significante waarde kunnen toevoegen aan uw 
        bedrijfsvoering. AI-Group staat klaar om deze oplossingen voor u te implementeren en 
        te zorgen voor een succesvolle realisatie van de geïdentificeerde kansen. Wij combineren 
        technische expertise met diepgaande kennis van bedrijfsprocessen om oplossingen te leveren 
        die direct waarde toevoegen aan uw organisatie.
      `,
      detailedOpportunities: basicAnalysis.aiOpportunities.map((opp: any) => ({
        ...opp,
        implementationPlan: {
          phase1: {
            title: "Voorbereiding en Planning",
            duration: "2-3 weken",
            activities: [
              "Vereistenanalyse en stakeholder interviews",
              "Technische architectuur ontwerp",
              "Projectplanning en resource allocatie"
            ]
          },
          phase2: {
            title: "Ontwikkeling en Implementatie",
            duration: opp.businessCase.timeToValue,
            activities: [
              "AI model training en fine-tuning",
              "Integratie met bestaande systemen",
              "Testing en kwaliteitsborging"
            ]
          },
          phase3: {
            title: "Launch en Optimalisatie",
            duration: "4-6 weken",
            activities: [
              "Pilot lancering met beperkte gebruikersgroep",
              "Monitoring en feedback verzameling"
            ]
          }
        },
        detailedBusinessCase: {
          ...opp.businessCase,
          financialProjection: {
            year1: {
              investment: opp.businessCase.implementationCost,
              expectedSavings: "€15.000 - €30.000",
              expectedRevenueIncrease: "€5.000 - €15.000",
              totalValue: "€20.000 - €45.000",
              roi: "50-120%",
              breakEvenPoint: "6-12 maanden",
              summary: "Kostenbesparingen worden gerealiseerd door automatisering van repetitieve taken en optimalisatie van processen. Omzetgroei wordt gerealiseerd door verbeterde klanttevredenheid en nieuwe verkoopmogelijkheden."
            }
          },
          riskAnalysis: {
            technicalRisks: [
              "Integratie uitdagingen met bestaande systemen",
              "Data kwaliteit en beschikbaarheid",
              "AI model performance in productie"
            ],
            businessRisks: [
              "Gebruikersacceptatie en change management",
              "ROI realisatie kan variëren",
              "Concurrentie en marktveranderingen"
            ],
            mitigations: [
              "Uitgebreide testing en pilot programma",
              "Gefaseerde implementatie met duidelijke milestones",
              "Continue monitoring en aanpassingen"
            ]
          }
        },
        technicalRequirements: [
          "Cloud infrastructuur (AWS/Azure/GCP)",
          "API integraties met bestaande systemen",
          "Data pipeline voor real-time verwerking",
          "Security en compliance maatregelen"
        ],
        successMetrics: [
          "Gebruikersadoptie percentage",
          "Tijdsbesparing in uren per week",
          "Kostenbesparing per kwartaal",
          "Klanttevredenheid scores",
          "ROI realisatie vs. projectie"
        ],
        aiGroupApproach: {
          whatWeDo: "AI-Group implementeert deze AI-oplossing door middel van consultancy, ontwikkeling en implementatie. We zorgen voor een op maat gemaakte oplossing die perfect aansluit bij uw bedrijfsprocessen. Ons team van AI-experts analyseert uw specifieke behoeften, ontwikkelt een op maat gemaakte oplossing, en zorgt voor een naadloze integratie met uw bestaande systemen.",
          howWeDoIt: "AI-Group gebruikt een bewezen methodologie met gefaseerde implementatie. We werken nauw samen met uw team, zorgen voor training en ondersteuning, en garanderen een succesvolle implementatie. Onze aanpak bestaat uit drie fasen: voorbereiding en planning, ontwikkeling en implementatie, en lancering en optimalisatie. Tijdens het hele proces houden we u op de hoogte en zorgen we voor continue feedback en aanpassingen.",
          whyChooseUs: "AI-Group heeft uitgebreide ervaring met AI-implementaties en combineert technische expertise met diepgaande kennis van bedrijfsprocessen. We zorgen voor een oplossing die direct waarde toevoegt aan uw bedrijf. Onze bewezen track record, flexibele aanpak en focus op uw succes maken ons de ideale partner voor uw AI-implementatie."
        }
      })),
      overallRecommendation: `
        AI-Group adviseert om te starten met de implementatie van ${basicAnalysis.aiOpportunities[0]?.title || "de eerste AI-kans"}, 
        aangezien deze de hoogste impact heeft en relatief snel te implementeren is. Na succesvolle 
        implementatie kunnen de andere kansen gefaseerd worden toegevoegd. AI-Group staat klaar om 
        u te begeleiden door het hele implementatieproces en zorgt voor een succesvolle realisatie 
        van deze kansen. Wij nodigen u uit voor een gesprek om te bespreken hoe we samen kunnen werken 
        aan het realiseren van deze AI-oplossingen.
      `,
      nextSteps: [
        "Neem contact op met AI-Group voor een vrijblijvend gesprek",
        "Plan een strategie sessie met AI-Group om prioriteiten te bepalen",
        "AI-Group bereidt een gedetailleerd projectplan voor",
        "Identificeer interne stakeholders voor samenwerking met AI-Group",
        "Start de samenwerking met AI-Group voor implementatie"
      ]
    };
  }
}

// Helper functie om category table HTML te genereren
function generateCategoryTable(categories: any[]): string {
  if (!categories || categories.length === 0) return '';
  return `
    <table>
      <tr>
        <th>Categorie</th>
        <th>Bedrag</th>
        <th>Uitleg</th>
      </tr>
      ${categories.map((cat: any) => 
        '<tr>' +
          '<td>' + (cat.category || 'N/A') + '</td>' +
          '<td><strong>' + (cat.amount || 'N/A') + '</strong></td>' +
          '<td>' + (cat.explanation || 'N/A') + '</td>' +
        '</tr>'
      ).join('')}
    </table>
  `;
}

// Genereer HTML email template
function generateEmailHTML(url: string, fullAnalysis: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #667eea; font-size: 24px; margin-bottom: 15px; }
        .opportunity { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .phase { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #667eea; color: white; }
        .highlight { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Uitgebreide AI Business Quickscan</h1>
          <p>Geanalyseerde website: ${url}</p>
        </div>
        <div class="content">
          <div class="section">
            <h2 class="section-title">Bestuurlijke Samenvatting</h2>
            <p>${fullAnalysis.executiveSummary}</p>
          </div>

          ${fullAnalysis.detailedOpportunities.map((opp: any, idx: number) => `
            <div class="section">
              <h2 class="section-title">${idx + 1}. ${opp.title}</h2>
              <div class="opportunity">
                <h3>Beschrijving</h3>
                <p>${opp.description}</p>
                
                <h3>Plan van Aanpak</h3>
                <div class="phase">
                  <strong>Fase 1: ${opp.implementationPlan.phase1.title}</strong> (${opp.implementationPlan.phase1.duration})
                  <ul>
                    ${opp.implementationPlan.phase1.activities.map((a: string) => `<li>${a}</li>`).join('')}
                  </ul>
                </div>
                <div class="phase">
                  <strong>Fase 2: ${opp.implementationPlan.phase2.title}</strong> (${opp.implementationPlan.phase2.duration})
                  <ul>
                    ${opp.implementationPlan.phase2.activities.map((a: string) => `<li>${a}</li>`).join('')}
                  </ul>
                </div>
                <div class="phase">
                  <strong>Fase 3: ${opp.implementationPlan.phase3.title}</strong> (${opp.implementationPlan.phase3.duration})
                  <ul>
                    ${opp.implementationPlan.phase3.activities.map((a: string) => `<li>${a}</li>`).join('')}
                  </ul>
                </div>

                <h3>Businesscase</h3>
                
                <h4>Financiële Overzicht Jaar 1</h4>
                <table>
                  <tr>
                    <th>Investering</th>
                    <th>Verwachte Besparingen</th>
                    <th>Verwachte Omzetgroei</th>
                    <th>Totale Waarde</th>
                    <th>ROI</th>
                  </tr>
                  <tr>
                    <td>${opp.detailedBusinessCase?.financialProjection?.year1?.investment || 'N/A'}</td>
                    <td>${opp.detailedBusinessCase?.financialProjection?.year1?.expectedSavings || 'N/A'}</td>
                    <td>${opp.detailedBusinessCase?.financialProjection?.year1?.expectedRevenueIncrease || 'N/A'}</td>
                    <td><strong>${opp.detailedBusinessCase?.financialProjection?.year1?.totalValue || 'N/A'}</strong></td>
                    <td><strong>${opp.detailedBusinessCase?.financialProjection?.year1?.roi || 'N/A'}</strong></td>
                  </tr>
                </table>
                
                ${opp.detailedBusinessCase?.financialProjection?.year1?.breakEvenPoint ? `
                <p style="margin-top: 15px;"><strong>Break-even punt:</strong> ${opp.detailedBusinessCase.financialProjection.year1.breakEvenPoint}</p>
                ` : ''}
                
                ${opp.detailedBusinessCase?.financialProjection?.year1?.summary ? `
                <div class="highlight" style="margin-top: 15px;">
                  <p>${opp.detailedBusinessCase.financialProjection.year1.summary}</p>
                </div>
                ` : ''}

                <h3>Risico Analyse</h3>
                <p><strong>Technische Risico's:</strong></p>
                <ul>
                  ${opp.detailedBusinessCase.riskAnalysis.technicalRisks.map((r: string) => `<li>${r}</li>`).join('')}
                </ul>
                <p><strong>Bedrijfsrisico's:</strong></p>
                <ul>
                  ${opp.detailedBusinessCase.riskAnalysis.businessRisks.map((r: string) => `<li>${r}</li>`).join('')}
                </ul>
                <p><strong>Mitigaties:</strong></p>
                <ul>
                  ${opp.detailedBusinessCase.riskAnalysis.mitigations.map((m: string) => `<li>${m}</li>`).join('')}
                </ul>

                <h3>Technische Vereisten</h3>
                <ul>
                  ${opp.technicalRequirements.map((req: string) => `<li>${req}</li>`).join('')}
                </ul>

                <h3>Succes Metrieken</h3>
                <ul>
                  ${opp.successMetrics.map((metric: string) => `<li>${metric}</li>`).join('')}
                </ul>

                <h3>Wat AI-Group voor U Doet</h3>
                <div class="highlight" style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 20px;">
                  <h4>Wat We Doen</h4>
                  <p>${opp.aiGroupApproach?.whatWeDo || 'AI-Group implementeert deze AI-oplossing door middel van consultancy, ontwikkeling en implementatie.'}</p>
                  
                  <h4>Hoe We Het Aanpakken</h4>
                  <p>${opp.aiGroupApproach?.howWeDoIt || 'AI-Group gebruikt een bewezen methodologie met gefaseerde implementatie.'}</p>
                  
                  <h4>Waarom Kiest U voor AI-Group?</h4>
                  <p>${opp.aiGroupApproach?.whyChooseUs || 'AI-Group heeft uitgebreide ervaring met AI-implementaties en combineert technische expertise met diepgaande kennis van bedrijfsprocessen.'}</p>
                </div>
              </div>
            </div>
          `).join('')}

          <div class="section">
            <h2 class="section-title">Algemene Aanbeveling</h2>
            <div class="highlight">
              <p>${fullAnalysis.overallRecommendation}</p>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Volgende Stappen</h2>
            <ol>
              ${fullAnalysis.nextSteps.map((step: string) => `<li>${step}</li>`).join('')}
            </ol>
          </div>
        </div>
        <div class="footer">
          <p>Deze analyse is gegenereerd op ${new Date().toLocaleDateString('nl-NL')}</p>
          <p>Voor vragen of meer informatie, neem contact met ons op.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  let email: string | undefined;
  let url: string | undefined;
  let quickscanId: string | undefined;
  
  try {
    // Parse request body met error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Ongeldig request body. Verwacht JSON formaat." },
        { status: 400 }
      );
    }
    
    quickscanId = body?.quickscanId;
    email = body?.email;
    url = body?.url;

    if (!email || !url) {
      console.error("Missing required fields:", { email: !!email, url: !!url, body });
      return NextResponse.json(
        { error: "Email en URL zijn verplicht" },
        { status: 400 }
      );
    }
    
    // Log dat we beginnen (zonder gevoelige data)
    console.log("Starting full scan request:", { hasEmail: !!email, hasUrl: !!url, quickscanId });

    // Valideer email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ongeldig emailadres" },
        { status: 400 }
      );
    }

    // Normaliseer email (lowercase en trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Controleer limiet voor uitgebreide scans (max 3 totaal per email)
    const fullScanCount = await prisma.fullQuickscan.count({
      where: {
        email: normalizedEmail,
      },
    });

    if (fullScanCount >= 3) {
      return NextResponse.json(
        { 
          error: "Limiet bereikt",
          message: "Je hebt je limiet van 3 gratis uitgebreide scans bereikt. Wil je meer gratis credits? Stuur een email naar businessscan@ai-group.nl met je verzoek.",
          limitReached: true,
          limitType: "fullscan",
          maxLimit: 3,
          currentCount: fullScanCount
        },
        { status: 429 } // 429 = Too Many Requests
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

    // Controleer of de website bereikbaar is
    const reachabilityCheck = await isWebsiteReachable(normalizedUrl);
    if (!reachabilityCheck.reachable) {
      return NextResponse.json(
        { error: reachabilityCheck.error || "Website is niet bereikbaar. Controleer of de URL correct is en of de website online is." },
        { status: 400 }
      );
    }

    // Genereer basis analyse (in productie zou je deze uit database halen)
    console.log("Starting website analysis for:", normalizedUrl);
    const basicAnalysis = await analyzeWebsite(normalizedUrl);
    console.log("Basic analysis completed");

    // Genereer uitgebreide analyse
    console.log("Starting full analysis generation");
    const fullAnalysis = await generateFullAnalysis(url, basicAnalysis);
    console.log("Full analysis completed");

    // Genereer email HTML
    const emailHTML = generateEmailHTML(normalizedUrl, fullAnalysis);

    // Verstuur email (alleen als SMTP configuratie is ingesteld)
    let emailSent = false;
    let emailSentAt: Date | null = null;
    
    const transporter = createTransporter();
    
    if (transporter) {
      try {
        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
        
        // Verstuur email naar gebruiker
        await transporter.sendMail({
          from: fromEmail,
          to: email,
          subject: `Uitgebreide AI Business Quickscan - ${url}`,
          html: emailHTML,
        });
        
        // Verstuur ook een kopie naar businessscan@ai-group.nl
        const internalEmailHTML = emailHTML.replace(
          '<h1>Uitgebreide AI Business Quickscan</h1>',
          `<h1>Uitgebreide AI Business Quickscan</h1><p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 20px;"><strong>Interne kopie:</strong> Deze analyse is verzonden naar ${email}</p>`
        );
        
        await transporter.sendMail({
          from: fromEmail,
          to: "businessscan@ai-group.nl",
          subject: `[Interne Kopie] Uitgebreide AI Business Quickscan - ${url} (voor ${email})`,
          html: internalEmailHTML,
        });
        
        emailSent = true;
        emailSentAt = new Date();
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Continue ook als email verzending faalt
      }
    } else {
      console.log("SMTP configuratie niet ingesteld, email wordt niet verzonden");
      console.log("Email zou worden verzonden naar:", email);
      console.log("Interne kopie zou worden verzonden naar: businessscan@ai-group.nl");
    }

    // Sla uitgebreide quickscan op in database (altijd, ook als email verzending faalt)
    let savedQuickscanId = quickscanId || `full_quickscan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      console.log("Attempting to save to database:", { savedQuickscanId, hasEmail: !!email, hasUrl: !!normalizedUrl });
      console.log("DATABASE_URL check:", process.env.DATABASE_URL ? "Set" : "NOT SET");
      
      const savedQuickscan = await prisma.fullQuickscan.create({
        data: {
          quickscanId: savedQuickscanId,
          email: normalizedEmail, // Genormaliseerd emailadres van de aanvrager wordt hier opgeslagen
          url: normalizedUrl,
          fullAnalysis: fullAnalysis as any,
          emailSent,
          emailSentAt,
        },
      });
      console.log(`Uitgebreide quickscan opgeslagen in database met email: ${email}, quickscanId: ${savedQuickscan.quickscanId}`);
      
      // Haal het aantal uitgebreide scans op voor dit email (na het opslaan)
      const fullScanCount = await prisma.fullQuickscan.count({
        where: {
          email: normalizedEmail,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Uitgebreide quickscan is gegenereerd en verzonden",
        quickscanId: savedQuickscanId,
        scanCount: {
          current: fullScanCount,
          max: 3,
          limitType: "fullscan"
        }
      });
    } catch (dbError) {
      console.error("Database error bij opslaan uitgebreide quickscan:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Onbekende database fout";
      const errorStack = dbError instanceof Error ? dbError.stack : undefined;
      console.error("Database error details:", { 
        errorMessage, 
        errorStack, 
        email, 
        url, 
        savedQuickscanId,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      });
      
      // Gooi de error door zodat de gebruiker weet dat er iets mis is gegaan
      return NextResponse.json(
        { 
          error: "Er is een fout opgetreden bij het opslaan van de uitgebreide quickscan in de database",
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Full quickscan error:", error);
    const errorMessage = error instanceof Error ? error.message : "Onbekende fout";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, email, url });
    
    return NextResponse.json(
      { 
        error: "Er is een fout opgetreden bij het genereren van de uitgebreide quickscan",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
