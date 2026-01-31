# Environment Variables toevoegen in Vercel

## Stap-voor-stap instructies

### Stap 1: Ga naar je Vercel Project
1. Log in op [vercel.com](https://vercel.com)
2. Ga naar je **Dashboard**
3. Klik op je project: **ai-businessscan** (of de naam van je project)

### Stap 2: Open Environment Variables
1. Klik op de tab **Settings** (bovenaan in je project)
2. Scroll naar beneden naar de sectie **Environment Variables**
3. Klik op **Add New** of **Add** (rechtsboven in de Environment Variables sectie)

### Stap 3: Voeg elke variabele toe
Voeg de volgende variabelen één voor één toe:

#### Variabele 1: SMTP_HOST
- **Key**: `SMTP_HOST`
- **Value**: `smtp.strato.com`
- **Environment**: Selecteer alle drie: ☑ Production, ☑ Preview, ☑ Development
- Klik op **Save**

#### Variabele 2: SMTP_PORT
- **Key**: `SMTP_PORT`
- **Value**: `587`
- **Environment**: Selecteer alle drie: ☑ Production, ☑ Preview, ☑ Development
- Klik op **Save**

#### Variabele 3: SMTP_SECURE
- **Key**: `SMTP_SECURE`
- **Value**: `false`
- **Environment**: Selecteer alle drie: ☑ Production, ☑ Preview, ☑ Development
- Klik op **Save**

#### Variabele 4: SMTP_USER
- **Key**: `SMTP_USER`
- **Value**: `noreply@ai-group.nl` (of je eigen emailadres)
- **Environment**: Selecteer alle drie: ☑ Production, ☑ Preview, ☑ Development
- Klik op **Save**

#### Variabele 5: SMTP_PASS
- **Key**: `SMTP_PASS`
- **Value**: `jouw-strato-email-wachtwoord` (je echte wachtwoord)
- **Environment**: Selecteer alle drie: ☑ Production, ☑ Preview, ☑ Development
- Klik op **Save**

#### Variabele 6: SMTP_FROM_EMAIL
- **Key**: `SMTP_FROM_EMAIL`
- **Value**: `noreply@ai-group.nl` (of je eigen emailadres)
- **Environment**: Selecteer alle drie: ☑ Production, ☑ Preview, ☑ Development
- Klik op **Save**

### Stap 4: Deploy opnieuw
Na het toevoegen van alle variabelen:

1. Ga naar de tab **Deployments** (bovenaan)
2. Klik op de drie puntjes (⋯) naast je laatste deployment
3. Klik op **Redeploy**
4. Of: maak een nieuwe commit en push naar GitHub (als je auto-deploy hebt ingeschakeld)

**Belangrijk**: Environment variables worden alleen geladen bij een nieuwe deployment. Je moet dus altijd opnieuw deployen na het toevoegen of wijzigen van variabelen.

## Visuele gids

```
Vercel Dashboard
  └── Je Project (ai-businessscan)
      └── Settings (tab)
          └── Environment Variables (sectie)
              └── Add New (knop)
                  └── Vul in:
                      Key: SMTP_HOST
                      Value: smtp.strato.com
                      Environment: ☑ Production ☑ Preview ☑ Development
                      └── Save
```

## Tips

- ✅ **Selecteer altijd alle drie de environments** (Production, Preview, Development) zodat het overal werkt
- ✅ **Gebruik exact dezelfde namen** als in je `.env` bestand (hoofdlettergevoelig!)
- ✅ **Check je spelling** - een typo in de key naam betekent dat de variabele niet wordt geladen
- ✅ **Deploy altijd opnieuw** na het toevoegen van variabelen
- ⚠️ **SMTP_PASS is gevoelig** - zorg dat je het juiste wachtwoord invult

## Verificatie

Na het deployen kun je controleren of de variabelen correct zijn geladen:

1. Ga naar je deployment
2. Klik op de deployment
3. Ga naar de **Logs** tab
4. Zoek naar console.log berichten die aangeven of SMTP configuratie is ingesteld

Als je in de logs ziet: "SMTP configuratie niet ingesteld", dan zijn de variabelen niet correct geladen. Controleer dan:
- Of alle variabelen zijn toegevoegd
- Of de namen exact overeenkomen (hoofdlettergevoelig)
- Of je opnieuw hebt gedeployed na het toevoegen
