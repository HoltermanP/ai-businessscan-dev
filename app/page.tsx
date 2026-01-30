"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Zap, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { normalizeUrl } from "@/lib/url-utils";
import { ScanProgress, type ScanStep } from "@/components/scan-progress";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanStep, setScanStep] = useState<ScanStep>("initializing");
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Simuleer scan progress - alleen starten wanneer isLoading true wordt
  useEffect(() => {
    // Cleanup bij unmount of wanneer isLoading false wordt
    if (!isLoading) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Reset progress state wanneer niet meer aan het laden
      setScanStep("initializing");
      setProgress(0);
      return;
    }

    // Start progress alleen als deze nog niet loopt
    if (progressIntervalRef.current) {
      return;
    }

    // Reset progress bij start
    setScanStep("initializing");
    setProgress(0);

    // Progress simulatie tijdens scan
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // Stop als we al op 100% zijn
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 100;
        }

        if (prev < 20) {
          setScanStep("initializing");
          return Math.min(20, prev + 2);
        } else if (prev < 40) {
          setScanStep("fetching");
          return Math.min(40, prev + 2);
        } else if (prev < 70) {
          setScanStep("analyzing");
          return Math.min(70, prev + 1.5);
        } else if (prev < 95) {
          setScanStep("generating");
          return Math.min(95, prev + 1);
        } else {
          // Bij 95%+ stoppen we de interval
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setScanStep("generating");
          return prev;
        }
      });
    }, 200);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Normaliseer URL (voeg https:// toe als nodig)
    const normalizedUrl = normalizeUrl(url.trim());

    // Reset progress voordat we starten
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setScanStep("initializing");
    setProgress(0);
    setIsLoading(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Stop de progress interval voordat we voltooien
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Voltooi de progress
        setScanStep("completed");
        setProgress(100);
        
        // Wacht kort zodat gebruiker de "completed" status ziet
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Sla genormaliseerde URL op in localStorage voor gebruik op resultaten pagina
        localStorage.setItem(`scan_${data.scanId}`, normalizedUrl);
        router.push(`/resultaten?scanId=${data.scanId}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Er is een fout opgetreden. Probeer het opnieuw.");
        setIsLoading(false);
      }
    } catch (error) {
      alert("Er is een fout opgetreden. Probeer het opnieuw.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Scan Progress - alleen tonen tijdens scan, verberg rest van content */}
        {isLoading ? (
          <div className="max-w-2xl mx-auto">
            <ScanProgress currentStep={scanStep} progress={progress} />
          </div>
        ) : (
          <>
            <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Business Analyse</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-50 mb-6 leading-tight">
            Ontdek de AI Kansen voor
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Jouw Bedrijf
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Voer simpelweg de URL van je website in en ontvang binnen enkele minuten een 
            gedetailleerde analyse met de top 3 AI-kansen inclusief concrete businesscases.
          </p>

          {/* URL Input Form */}
          <Card className="max-w-2xl mx-auto shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Start je gratis scan</CardTitle>
              <CardDescription>
                Voer de URL van je bedrijfswebsite in om te beginnen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="jouwbedrijf.nl of https://jouwbedrijf.nl"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 text-lg h-12"
                    disabled={isLoading}
                    required
                  />
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="h-12 px-8"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Scannen...
                      </>
                    ) : (
                      <>
                        Scan Starten
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-12">
            Wat krijg je in je scan?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Bedrijfsanalyse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Een uitgebreide beschrijving van je bedrijf op basis van je website, 
                  inclusief diensten, doelgroep en marktpositie.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Top 3 AI Kansen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Drie concrete AI-toepassingen die perfect passen bij jouw bedrijf, 
                  met uitleg waarom ze relevant zijn.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Businesscase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Globale inschatting van de potentiële impact, ROI en implementatiekosten 
                  voor elke AI-kans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-24 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader>
              <Mail className="w-12 h-12 mx-auto mb-4" />
              <CardTitle className="text-3xl text-white">
                Wil je een uitgebreide analyse?
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Vraag een volledige scan aan en ontvang per email:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-left max-w-md mx-auto space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Uitgebreide bedrijfsanalyse</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Gedetailleerd implementatievoorstel</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Plan van aanpak per AI-kans</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Complete businesscase met ROI-berekening</span>
                </li>
              </ul>
              <p className="text-blue-100 mb-4">
                Deze optie is beschikbaar na het bekijken van je gratis scan resultaten.
              </p>
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
