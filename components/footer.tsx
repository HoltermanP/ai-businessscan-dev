import Link from "next/link";
import { Mail, Phone, Globe, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Bedrijfsinformatie */}
          <div>
            <h3 className="font-semibold text-lg mb-4">AI-Group</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Deze applicatie is ontwikkeld door AI-Group. Sneller door AI. Slimmer door AI. Goedkoper door AI.
            </p>
            <div className="space-y-2 text-sm">
              <a
                href="https://ai-group.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>ai-group.nl</span>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <div className="space-y-2 text-sm">
              <a
                href="mailto:businessscan@ai-group.nl"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>businessscan@ai-group.nl</span>
              </a>
              <a
                href="tel:0630985351"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>06-30985351</span>
              </a>
              <a
                href="https://www.linkedin.com/company/ai-groupnl/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Informatie</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/privacy"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacyverklaring
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} AI-Group. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
}
