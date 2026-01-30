import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { normalizeUrl, isValidUrl } from "@/lib/url-utils";
import OpenAI from "openai";
import { prisma } from "@/lib/db";

// Initialiseer Resend (gebruik environment variable in productie)
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_key");

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
- Geef alleen geldige JSON terug, geen extra tekst ervoor of erna`;

    // Roep OpenAI API aan (gebruik gpt-4o voor uitgebreide rapporten)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
    const prompt = `Je bent een expert in bedrijfsanalyse en AI-implementaties. Op basis van de volgende basis analyse, genereer een uitgebreid rapport/voorstel in JSON formaat.

Website URL: ${url}
Bedrijfsbeschrijving: ${basicAnalysis.companyDescription}

AI Kansen:
${JSON.stringify(basicAnalysis.aiOpportunities, null, 2)}

Geef een JSON response terug met het volgende formaat:
{
  "executiveSummary": "Een uitgebreide executive summary (minimaal 200 woorden) die de belangrijkste bevindingen samenvat",
  "detailedOpportunities": [
    {
      "id": 1,
      "title": "Titel van de AI-kans",
      "description": "Beschrijving (overgenomen van basis analyse)",
      "businessCase": {
        "potentialImpact": "...",
        "estimatedROI": "...",
        "implementationCost": "...",
        "timeToValue": "...",
        "benefits": [...]
      },
      "implementationPlan": {
        "phase1": {
          "title": "Fase 1 titel",
          "duration": "bijv. 2-3 weken",
          "activities": ["activiteit 1", "activiteit 2", "activiteit 3", "activiteit 4"]
        },
        "phase2": {
          "title": "Fase 2 titel",
          "duration": "gebruik timeToValue uit businessCase",
          "activities": ["activiteit 1", "activiteit 2", "activiteit 3", "activiteit 4"]
        },
        "phase3": {
          "title": "Fase 3 titel",
          "duration": "bijv. 4-6 weken",
          "activities": ["activiteit 1", "activiteit 2", "activiteit 3", "activiteit 4"]
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
            "expectedSavings": "realistische schatting gebaseerd op de AI-kans",
            "roi": "gebruik estimatedROI"
          },
          "year2": {
            "investment": "€5.000 - €10.000 (onderhoud)",
            "expectedSavings": "realistische schatting (meestal hoger dan jaar 1)",
            "roi": "realistische ROI voor jaar 2"
          },
          "year3": {
            "investment": "€5.000 - €10.000 (onderhoud)",
            "expectedSavings": "realistische schatting (meestal hoger dan jaar 2)",
            "roi": "realistische ROI voor jaar 3"
          }
        },
        "riskAnalysis": {
          "technicalRisks": ["risico 1", "risico 2", "risico 3"],
          "businessRisks": ["risico 1", "risico 2", "risico 3"],
          "mitigations": ["mitigatie 1", "mitigatie 2", "mitigatie 3"]
        }
      },
      "technicalRequirements": ["vereiste 1", "vereiste 2", "vereiste 3", "vereiste 4"],
      "successMetrics": ["metric 1", "metric 2", "metric 3", "metric 4", "metric 5"]
    }
  ],
  "overallRecommendation": "Een uitgebreide aanbeveling (minimaal 150 woorden) die adviseert welke AI-kans als eerste geïmplementeerd moet worden en waarom",
  "nextSteps": ["stap 1", "stap 2", "stap 3", "stap 4", "stap 5"]
}

Belangrijk:
- Focus alleen op de AI-kansen die in de basis analyse zijn gegeven - deze zijn al gefilterd op relevantie
- Geef voor elke AI-kans een gedetailleerd implementatieplan met 3 fasen
- Maak realistische financiële projecties gebaseerd op de specifieke AI-kans en het specifieke bedrijf
- Voor de financialProjection: geef concrete, onderbouwde schattingen van besparingen en omzetgroei. Leg uit hoe deze worden gerealiseerd (bijv. tijdsbesparing, kostenreductie, omzetgroei). Wees realistisch maar wel aanlokkend - geen overdreven claims
- Identificeer specifieke risico's en mitigaties voor elke kans
- Maak alles specifiek en relevant voor dit bedrijf - geen generieke voorbeelden
- Zorg dat alle details aansluiten bij de werkelijke bedrijfsactiviteiten zoals beschreven in de bedrijfsbeschrijving
- De businesscase moet overtuigend zijn maar gebaseerd op realistische aannames - gebruik concrete voorbeelden uit de bedrijfsactiviteiten
- Geef alleen geldige JSON terug, geen extra tekst`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Je bent een expert in bedrijfsanalyse en AI-implementaties. Je geeft altijd geldige JSON responses terug zonder extra tekst. Je bent zeer kritisch en zorgt ervoor dat alle details specifiek en relevant zijn voor het geanalyseerde bedrijf. Vermijd generieke voorbeelden of standaard implementatieplannen.",
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
    return {
      executiveSummary: fullAnalysis.executiveSummary || "Uitgebreide analyse van AI-implementatiemogelijkheden.",
      detailedOpportunities: (fullAnalysis.detailedOpportunities || []).map((opp: any, index: number) => ({
        ...basicAnalysis.aiOpportunities[index],
        ...opp,
        id: opp.id || index + 1,
        title: opp.title || basicAnalysis.aiOpportunities[index]?.title || `AI Kans ${index + 1}`,
        description: opp.description || basicAnalysis.aiOpportunities[index]?.description || "",
        implementationPlan: opp.implementationPlan || {
          phase1: { title: "Voorbereiding", duration: "2-3 weken", activities: [] },
          phase2: { title: "Implementatie", duration: "2-3 maanden", activities: [] },
          phase3: { title: "Launch", duration: "4-6 weken", activities: [] },
        },
        detailedBusinessCase: opp.detailedBusinessCase || {
          ...basicAnalysis.aiOpportunities[index]?.businessCase,
          financialProjection: { year1: {}, year2: {}, year3: {} },
          riskAnalysis: { technicalRisks: [], businessRisks: [], mitigations: [] },
        },
        technicalRequirements: opp.technicalRequirements || [],
        successMetrics: opp.successMetrics || [],
      })),
      overallRecommendation: fullAnalysis.overallRecommendation || `Wij adviseren om te starten met ${basicAnalysis.aiOpportunities[0]?.title || "de eerste AI-kans"}.`,
      nextSteps: fullAnalysis.nextSteps || [
        "Plan een strategie sessie",
        "Bereid projectplan voor",
        "Identificeer stakeholders",
        "Stel projectteam samen",
        "Definieer success criteria",
      ],
    };
  } catch (error) {
    console.error("OpenAI full analysis error:", error);
    
    // Fallback naar basis structuur als OpenAI faalt
    return {
      executiveSummary: `
        Deze uitgebreide analyse biedt een diepgaande evaluatie van de AI-implementatiemogelijkheden 
        voor uw bedrijf. Op basis van de website analyse en marktonderzoek hebben we drie 
        strategische AI-kansen geïdentificeerd die significante waarde kunnen toevoegen aan uw 
        bedrijfsvoering.
      `,
      detailedOpportunities: basicAnalysis.aiOpportunities.map((opp: any) => ({
        ...opp,
        implementationPlan: {
          phase1: {
            title: "Voorbereiding en Planning",
            duration: "2-3 weken",
            activities: [
              "Requirements analyse en stakeholder interviews",
              "Technische architectuur ontwerp",
              "Projectplanning en resource allocatie",
              "Proof of Concept ontwikkeling"
            ]
          },
          phase2: {
            title: "Ontwikkeling en Implementatie",
            duration: opp.businessCase.timeToValue,
            activities: [
              "AI model training en fine-tuning",
              "Integratie met bestaande systemen",
              "User interface ontwikkeling",
              "Testing en kwaliteitsborging"
            ]
          },
          phase3: {
            title: "Launch en Optimalisatie",
            duration: "4-6 weken",
            activities: [
              "Pilot launch met beperkte gebruikersgroep",
              "Monitoring en performance tracking",
              "Feedback verzameling en iteratie",
              "Full-scale rollout"
            ]
          }
        },
        detailedBusinessCase: {
          ...opp.businessCase,
          financialProjection: {
            year1: {
              investment: opp.businessCase.implementationCost,
              expectedSavings: "€45.000 - €75.000",
              roi: opp.businessCase.estimatedROI
            },
            year2: {
              investment: "€5.000 - €10.000 (onderhoud)",
              expectedSavings: "€60.000 - €100.000",
              roi: "300-500%"
            },
            year3: {
              investment: "€5.000 - €10.000 (onderhoud)",
              expectedSavings: "€75.000 - €125.000",
              roi: "400-600%"
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
        ]
      })),
      overallRecommendation: `
        Wij adviseren om te starten met de implementatie van ${basicAnalysis.aiOpportunities[0]?.title || "de eerste AI-kans"}, 
        aangezien deze de hoogste impact heeft en relatief snel te implementeren is. Na succesvolle 
        implementatie kunnen de andere kansen gefaseerd worden toegevoegd.
      `,
      nextSteps: [
        "Plan een strategie sessie om prioriteiten te bepalen",
        "Bereid een gedetailleerd projectplan voor",
        "Identificeer interne stakeholders en champions",
        "Stel een projectteam samen",
        "Definieer success criteria en KPI's"
      ]
    };
  }
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
            <h2 class="section-title">Executive Summary</h2>
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

                <h3>Gedetailleerde Businesscase</h3>
                <table>
                  <tr>
                    <th>Jaar</th>
                    <th>Investering</th>
                    <th>Verwachte Besparingen</th>
                    <th>ROI</th>
                  </tr>
                  <tr>
                    <td>Jaar 1</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year1.investment}</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year1.expectedSavings}</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year1.roi}</td>
                  </tr>
                  <tr>
                    <td>Jaar 2</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year2.investment}</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year2.expectedSavings}</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year2.roi}</td>
                  </tr>
                  <tr>
                    <td>Jaar 3</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year3.investment}</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year3.expectedSavings}</td>
                    <td>${opp.detailedBusinessCase.financialProjection.year3.roi}</td>
                  </tr>
                </table>

                <h3>Risico Analyse</h3>
                <p><strong>Technische Risico's:</strong></p>
                <ul>
                  ${opp.detailedBusinessCase.riskAnalysis.technicalRisks.map((r: string) => `<li>${r}</li>`).join('')}
                </ul>
                <p><strong>Business Risico's:</strong></p>
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

                <h3>Success Metrics</h3>
                <ul>
                  ${opp.successMetrics.map((metric: string) => `<li>${metric}</li>`).join('')}
                </ul>
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
    const body = await request.json();
    quickscanId = body.quickscanId;
    email = body.email;
    url = body.url;

    if (!email || !url) {
      return NextResponse.json(
        { error: "Email en URL zijn verplicht" },
        { status: 400 }
      );
    }

    // Valideer email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ongeldig emailadres" },
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

    // Genereer basis analyse (in productie zou je deze uit database halen)
    const basicAnalysis = await analyzeWebsite(normalizedUrl);

    // Genereer uitgebreide analyse
    const fullAnalysis = await generateFullAnalysis(url, basicAnalysis);

    // Genereer email HTML
    const emailHTML = generateEmailHTML(normalizedUrl, fullAnalysis);

    // Verstuur email (alleen als RESEND_API_KEY is ingesteld)
    let emailSent = false;
    let emailSentAt: Date | null = null;
    
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder_key") {
      try {
        // Verstuur email naar gebruiker
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: email,
          subject: `Uitgebreide AI Business Quickscan - ${url}`,
          html: emailHTML,
        });
        
        // Verstuur ook een kopie naar businessscan@ai-group.nl
        const internalEmailHTML = emailHTML.replace(
          '<h1>Uitgebreide AI Business Quickscan</h1>',
          `<h1>Uitgebreide AI Business Quickscan</h1><p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 20px;"><strong>Interne kopie:</strong> Deze analyse is verzonden naar ${email}</p>`
        );
        
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
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
      console.log("RESEND_API_KEY niet ingesteld, email wordt niet verzonden");
      console.log("Email zou worden verzonden naar:", email);
      console.log("Interne kopie zou worden verzonden naar: businessscan@ai-group.nl");
    }

    // Sla uitgebreide quickscan op in database (altijd, ook als email verzending faalt)
    let savedQuickscanId = quickscanId || `full_quickscan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      const savedQuickscan = await prisma.fullQuickscan.create({
        data: {
          quickscanId: savedQuickscanId,
          email, // Emailadres van de aanvrager wordt hier opgeslagen
          url: normalizedUrl,
          fullAnalysis: fullAnalysis as any,
          emailSent,
          emailSentAt,
        },
      });
      console.log(`Uitgebreide quickscan opgeslagen in database met email: ${email}, quickscanId: ${savedQuickscan.quickscanId}`);
    } catch (dbError) {
      console.error("Database error bij opslaan uitgebreide quickscan:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Onbekende database fout";
      const errorStack = dbError instanceof Error ? dbError.stack : undefined;
      console.error("Database error details:", { errorMessage, errorStack, email, url, savedQuickscanId });
      
      // Gooi de error door zodat de gebruiker weet dat er iets mis is gegaan
      return NextResponse.json(
        { 
          error: "Er is een fout opgetreden bij het opslaan van de uitgebreide quickscan in de database",
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Uitgebreide quickscan is gegenereerd en verzonden",
      quickscanId: savedQuickscanId,
    });
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
