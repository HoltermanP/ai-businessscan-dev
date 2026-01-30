"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Zap, Mail, ArrowLeft, CheckCircle2, Euro, Clock, Target } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface AIOpportunity {
  id: number;
  title: string;
  description: string;
  businessCase: {
    potentialImpact: string;
    estimatedROI: string;
    implementationCost: string;
    timeToValue: string;
    benefits: string[];
    rationale?: string;
    keyMetrics?: string[];
  };
}

interface QuickscanResult {
  quickscanId: string;
  url: string;
  companyDescription: string;
  aiOpportunities: AIOpportunity[];
  createdAt: string;
}

function ResultatenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quickscanResult, setQuickscanResult] = useState<QuickscanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingFullQuickscan, setIsRequestingFullQuickscan] = useState(false);
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const quickscanId = searchParams.get("quickscanId");
    if (!quickscanId) {
      router.push("/");
      return;
    }

    // In productie zou je hier de quickscan resultaten ophalen uit een database
    // Voor nu gebruiken we de quickscanId om de data opnieuw te genereren
    fetchQuickscanResult(quickscanId);
  }, [searchParams, router]);

  const fetchQuickscanResult = async (quickscanId: string) => {
    setIsLoading(true);
    
    try {
      // Haal quickscan op uit database
      const response = await fetch(`/api/quickscan/${quickscanId}`);
      
      if (response.ok) {
        const data = await response.json();
        setQuickscanResult(data);
      } else {
        // Fallback naar oude methode als quickscan niet in database staat
        const storedUrl = localStorage.getItem(`quickscan_${quickscanId}`);
        if (storedUrl) {
          const quickscanResponse = await fetch("/api/quickscan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: storedUrl }),
          });
          
          if (quickscanResponse.ok) {
            const quickscanData = await quickscanResponse.json();
            setQuickscanResult(quickscanData);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching quickscan result:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestFullQuickscan = async () => {
    if (!email || !quickscanResult) return;

    setIsRequestingFullQuickscan(true);
    try {
      const response = await fetch("/api/full-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quickscanId: quickscanResult.quickscanId,
          email,
          url: quickscanResult.url,
        }),
      });

      if (response.ok) {
        alert("Uitgebreide quickscan aangevraagd! Je ontvangt binnenkort een email met de volledige analyse.");
        setShowEmailForm(false);
      } else {
        alert("Er is een fout opgetreden. Probeer het opnieuw.");
      }
    } catch (error) {
      alert("Er is een fout opgetreden. Probeer het opnieuw.");
    } finally {
      setIsRequestingFullQuickscan(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Resultaten laden...</p>
        </div>
      </div>
    );
  }

  if (!quickscanResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Quickscan niet gevonden</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>Terug naar home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar home
        </Button>

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 mb-4">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Quickscan Voltooid</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-4">
              Je Bedrijfsanalyse is Klaar
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Geanalyseerde website: <span className="font-semibold">{quickscanResult.url}</span>
            </p>
          </div>

          {/* Bedrijfsbeschrijving */}
          <Card className="mb-8 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Bedrijfsbeschrijving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{quickscanResult.companyDescription}</p>
            </CardContent>
          </Card>

          {/* Top 3 AI Kansen */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6 text-center">
              Top 3 AI Kansen voor Jouw Bedrijf
            </h2>
            <div className="space-y-6">
              {quickscanResult.aiOpportunities.map((opportunity, index) => (
                <Card key={opportunity.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
                          <CardDescription className="mt-1 text-gray-600 dark:text-gray-300">{opportunity.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-50">
                          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Businesscase
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <span className="font-medium">Impact:</span>
                            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {opportunity.businessCase.potentialImpact}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <Euro className="w-4 h-4" />
                            <span className="font-medium">Geschatte ROI:</span>
                            <span>{opportunity.businessCase.estimatedROI}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <Euro className="w-4 h-4" />
                            <span className="font-medium">Implementatiekosten:</span>
                            <span>{opportunity.businessCase.implementationCost}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Time to Value:</span>
                            <span>{opportunity.businessCase.timeToValue}</span>
                          </div>
                          {opportunity.businessCase.rationale && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                                <span className="font-medium">Onderbouwing: </span>
                                {opportunity.businessCase.rationale}
                              </p>
                            </div>
                          )}
                          {opportunity.businessCase.keyMetrics && opportunity.businessCase.keyMetrics.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Belangrijkste metrics:</p>
                              <ul className="space-y-1">
                                {opportunity.businessCase.keyMetrics.map((metric: string, idx: number) => (
                                  <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                    <span>{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-50">
                          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Belangrijkste Voordelen
                        </h3>
                        <ul className="space-y-2">
                          {opportunity.businessCase.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA voor Uitgebreide Quickscan */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl text-white flex items-center gap-2">
                <Mail className="w-8 h-8" />
                Wil je een uitgebreide analyse?
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Ontvang een volledige quickscan per email met implementatievoorstel, plan van aanpak en gedetailleerde businesscase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showEmailForm ? (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full md:w-auto"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Vraag Uitgebreide Quickscan Aan
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Je emailadres
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleRequestFullQuickscan}
                      disabled={!email || isRequestingFullQuickscan}
                      className="flex-1"
                    >
                      {isRequestingFullQuickscan ? "Verzenden..." : "Verstuur Aanvraag"}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setShowEmailForm(false)}
                      className="border-white text-white hover:bg-white/10"
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResultatenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Laden...</p>
          </div>
        </div>
      }
    >
      <ResultatenContent />
    </Suspense>
  );
}
