# SMTP Email Configuratie

Dit project gebruikt **nodemailer** om emails te versturen via je eigen SMTP server. Hieronder vind je instructies voor het configureren van email verzending.

## Environment Variables

Voeg de volgende environment variables toe aan je `.env` bestand (lokaal) of in je Vercel project settings (productie):

```env
# SMTP Host (bijv. smtp.jouwdomein.nl, smtp.gmail.com, smtp.office365.com)
SMTP_HOST=smtp.jouwdomein.nl

# SMTP Poort (meestal 587 voor TLS, 465 voor SSL, 25 voor onversleuteld)
SMTP_PORT=587

# SMTP Secure (true voor poort 465 met SSL, false voor poort 587 met TLS)
SMTP_SECURE=false

# SMTP Gebruikersnaam (meestal je emailadres)
SMTP_USER=noreply@jouwdomein.nl

# SMTP Wachtwoord (app-specifiek wachtwoord of je normale email wachtwoord)
SMTP_PASS=jouw_wachtwoord

# Van emailadres (optioneel, gebruikt SMTP_USER als niet ingesteld)
SMTP_FROM_EMAIL=noreply@jouwdomein.nl
```

## Veelvoorkomende SMTP Instellingen

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jouw-email@gmail.com
SMTP_PASS=jouw-app-wachtwoord
SMTP_FROM_EMAIL=jouw-email@gmail.com
```

**Belangrijk voor Gmail:**
- Je moet een [App Password](https://support.google.com/accounts/answer/185833) gebruiken, niet je normale wachtwoord
- 2-factor authenticatie moet ingeschakeld zijn
- Ga naar: Google Account → Security → 2-Step Verification → App passwords

### Outlook / Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jouw-email@outlook.com
SMTP_PASS=jouw-wachtwoord
SMTP_FROM_EMAIL=jouw-email@outlook.com
```

### Strato

Voor **Strato** hosting gebruik je deze instellingen:

```env
SMTP_HOST=smtp.strato.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jouw-email@jouwdomein.nl
SMTP_PASS=jouw-strato-email-wachtwoord
SMTP_FROM_EMAIL=noreply@jouwdomein.nl
```

**Belangrijk voor Strato:**
- Gebruik je **volledige emailadres** als SMTP_USER (bijv. `noreply@ai-group.nl`)
- Gebruik het **wachtwoord van je email account** als SMTP_PASS
- Poort **587** met TLS is de standaard (SMTP_SECURE=false)
- Alternatief: poort **465** met SSL (zet dan SMTP_SECURE=true)
- Je kunt ook `mail.strato.com` proberen als SMTP_HOST als `smtp.strato.com` niet werkt

**Waar vind je je Strato email instellingen:**
1. Log in op je Strato account
2. Ga naar **E-mail** → **E-mail accounts**
3. Klik op je email account
4. Hier vind je de SMTP instellingen

### Eigen Mailserver (via andere Hosting Providers)

Voor andere hosting providers (bijv. TransIP, Hostinger, Mijndomein):

```env
SMTP_HOST=smtp.jouwdomein.nl
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@jouwdomein.nl
SMTP_PASS=jouw-email-wachtwoord
SMTP_FROM_EMAIL=noreply@jouwdomein.nl
```

**Vraag je hosting provider om:**
- SMTP host adres
- SMTP poort (meestal 587 of 465)
- Of SSL/TLS vereist is
- Of authenticatie vereist is

### Mailgun (via SMTP)

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@jouwdomein.mailgun.org
SMTP_PASS=jouw-mailgun-smtp-password
SMTP_FROM_EMAIL=noreply@jouwdomein.nl
```

### SendGrid (via SMTP)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=jouw-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@jouwdomein.nl
```

## Configuratie in Vercel

1. Ga naar je Vercel project
2. Klik op **Settings** → **Environment Variables**
3. Voeg alle SMTP variabelen toe (voor Production, Preview en Development)
4. Deploy opnieuw na het toevoegen van de variabelen

## Testen

Na het configureren van de SMTP instellingen, test de email verzending door een quickscan uit te voeren. Controleer de console logs voor eventuele foutmeldingen.

Als er geen SMTP configuratie is ingesteld, worden emails niet verzonden maar wordt dit wel gelogd in de console.

## Troubleshooting

### "Connection timeout" of "Connection refused"
- Controleer of de SMTP_HOST en SMTP_PORT correct zijn
- Controleer of je firewall de SMTP poort niet blokkeert
- Probeer een andere poort (587 of 465)

### "Authentication failed"
- Controleer of SMTP_USER en SMTP_PASS correct zijn
- Voor Gmail: gebruik een App Password, niet je normale wachtwoord
- Controleer of je email account niet geblokkeerd is

### "Self signed certificate" error
- Zet `SMTP_SECURE=false` en gebruik poort 587 (TLS)
- Of gebruik poort 465 met `SMTP_SECURE=true` (SSL)

### Emails komen aan in spam
- Zorg dat je SPF, DKIM en DMARC records correct zijn ingesteld voor je domein
- Gebruik een "van" emailadres dat bij je domein hoort
- Voeg een reply-to adres toe indien nodig
