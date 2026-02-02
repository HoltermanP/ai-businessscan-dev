import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar home
            </Button>
          </Link>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-3xl">Privacyverklaring</CardTitle>
              <CardDescription>
                Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <div className="space-y-6 text-gray-700 dark:text-gray-200">
                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">1. Inleiding</h2>
                  <p>
                    AI-Group ("wij", "ons", "onze") respecteert uw privacy en zet zich in voor de bescherming van uw persoonlijke gegevens. 
                    Deze privacyverklaring legt uit hoe wij omgaan met uw gegevens wanneer u onze AI Business Quickscan service gebruikt.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">2. Gegevens die wij verzamelen</h2>
                  <p className="mb-2">Wij verzamelen de volgende gegevens:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Website URL:</strong> De URL van de website die u invoert voor de quickscan</li>
                    <li><strong>Emailadres:</strong> Indien u kiest voor een uitgebreide quickscan, verzamelen wij uw emailadres</li>
                    <li><strong>IP-adres:</strong> Wij kunnen uw IP-adres registreren voor beveiligings- en analyse doeleinden</li>
                    <li><strong>Technische gegevens:</strong> Browser type, besturingssysteem en andere technische informatie</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">3. Doeleinden van gegevensverwerking</h2>
                  <p className="mb-2">Wij gebruiken uw gegevens voor de volgende doeleinden:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Het uitvoeren van de AI Business Quickscan op basis van uw website</li>
                    <li>Het verzenden van uitgebreide quickscan resultaten per email (indien aangevraagd)</li>
                    <li>Het verbeteren van onze service en technologie</li>
                    <li>Het voorkomen van misbruik en het handhaven van beveiliging</li>
                    <li>Het naleven van wettelijke verplichtingen</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">4. Rechtsgrondslag</h2>
                  <p>
                    Wij verwerken uw gegevens op basis van:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>Toestemming:</strong> U geeft toestemming door gebruik te maken van onze service</li>
                    <li><strong>Gerechtvaardigd belang:</strong> Voor het verbeteren van onze service en beveiliging</li>
                    <li><strong>Wettelijke verplichting:</strong> Voor het naleven van toepasselijke wetgeving</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">5. Bewaartermijn</h2>
                  <p>
                    Wij bewaren uw gegevens niet langer dan noodzakelijk voor de doeleinden waarvoor zij zijn verzameld. 
                    Quickscan resultaten worden bewaard zolang dit nodig is voor de service, maar niet langer dan 1 jaar na de laatste activiteit.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">6. Delen van gegevens</h2>
                  <p>
                    Wij delen uw gegevens niet met derden, behalve:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Wanneer dit wettelijk verplicht is</li>
                    <li>Met serviceproviders die ons helpen bij het leveren van de service (zoals hosting providers), 
                        waarbij deze providers contractueel verplicht zijn om uw gegevens te beschermen</li>
                    <li>Met uw uitdrukkelijke toestemming</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">7. Uw rechten</h2>
                  <p className="mb-2">U heeft de volgende rechten met betrekking tot uw persoonsgegevens:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Inzage:</strong> Het recht om te weten welke gegevens wij van u verwerken</li>
                    <li><strong>Rectificatie:</strong> Het recht om onjuiste gegevens te laten corrigeren</li>
                    <li><strong>Verwijdering:</strong> Het recht om uw gegevens te laten verwijderen</li>
                    <li><strong>Beperking:</strong> Het recht om de verwerking van uw gegevens te beperken</li>
                    <li><strong>Bezwaar:</strong> Het recht om bezwaar te maken tegen de verwerking</li>
                    <li><strong>Gegevensoverdraagbaarheid:</strong> Het recht om uw gegevens in een gestructureerd formaat te ontvangen</li>
                  </ul>
                  <p className="mt-4">
                    Om gebruik te maken van deze rechten, kunt u contact met ons opnemen via{" "}
                    <a href="mailto:businessscan@ai-group.nl" className="text-blue-600 dark:text-blue-400 hover:underline">
                      businessscan@ai-group.nl
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">8. Beveiliging</h2>
                  <p>
                    Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen tegen 
                    ongeautoriseerde toegang, verlies, vernietiging of wijziging. Dit omvat onder meer encryptie, 
                    toegangscontroles en regelmatige beveiligingsaudits.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">9. Cookies</h2>
                  <p>
                    Onze website gebruikt cookies en vergelijkbare technologieën om de functionaliteit te verbeteren 
                    en gebruikerservaring te optimaliseren. U kunt cookies uitschakelen via uw browserinstellingen, 
                    maar dit kan de functionaliteit van de website beïnvloeden.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">10. Wijzigingen</h2>
                  <p>
                    Wij behouden ons het recht voor om deze privacyverklaring te wijzigen. Wijzigingen worden 
                    gepubliceerd op deze pagina met een bijgewerkte datum. Wij raden u aan deze privacyverklaring 
                    regelmatig te raadplegen.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">11. Contact</h2>
                  <p className="mb-2">
                    Voor vragen over deze privacyverklaring of over de verwerking van uw gegevens, kunt u contact met ons opnemen:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="font-semibold mb-2">AI-Group</p>
                    <p>Email: <a href="mailto:businessscan@ai-group.nl" className="text-blue-600 dark:text-blue-400 hover:underline">businessscan@ai-group.nl</a></p>
                    <p>Telefoon: <a href="tel:0630985351" className="text-blue-600 dark:text-blue-400 hover:underline">06-30985351</a></p>
                    <p>Website: <a href="https://ai-group.nl" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">ai-group.nl</a></p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">12. Klacht indienen</h2>
                  <p>
                    Als u niet tevreden bent met hoe wij omgaan met uw gegevens, heeft u het recht om een klacht in te dienen 
                    bij de Autoriteit Persoonsgegevens (AP). Meer informatie vindt u op{" "}
                    <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      autoriteitpersoonsgegevens.nl
                    </a>
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
