# Prisma Engine Type Fix voor Vercel

## Probleem
Prisma detecteert automatisch dat het in een serverless omgeving (Vercel) draait en probeert engine type "client" te gebruiken, wat een adapter of accelerateUrl vereist. Dit veroorzaakt de fout:
```
Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

## Oplossing

### Stap 1: Voeg Environment Variable toe in Vercel (BELANGRIJK!)

**Dit is de belangrijkste stap!** De environment variable moet worden ingesteld VOORDAT `prisma generate` wordt uitgevoerd tijdens de build.

1. Ga naar je Vercel project dashboard
2. Ga naar **Settings** → **Environment Variables**
3. Voeg een nieuwe environment variable toe:
   - **Name**: `PRISMA_CLIENT_ENGINE_TYPE`
   - **Value**: `library`
   - **Environment**: Selecteer alle omgevingen (Production, Preview, Development)
4. Klik op **Save**

### Stap 2: Code is al aangepast

De volgende aanpassingen zijn al gemaakt in de code:
- ✅ `package.json` build scripts aangepast om `PRISMA_CLIENT_ENGINE_TYPE=library` in te stellen
- ✅ `vercel.json` aangemaakt om dit tijdens install te forceren
- ✅ `lib/db.ts` aangepast om de environment variable in te stellen tijdens runtime (backup)

### Stap 3: Redeploy

Na het toevoegen van de environment variable in Vercel:
1. Ga naar **Deployments** in Vercel
2. Klik op de drie puntjes naast de laatste deployment
3. Kies **Redeploy** om een nieuwe deployment te maken met de nieuwe environment variable

### Stap 4: Controleer

Na de nieuwe deployment:
1. Test je API endpoints
2. Check de Vercel logs om te bevestigen dat de database connectie werkt
3. De foutmelding zou nu verdwenen moeten zijn

## Technische Details

- **Prisma versie**: 7.2.0 (gedowngraded van 7.3.0)
- **Engine type**: `library` (in plaats van `client`)
- **Environment variable**: `PRISMA_CLIENT_ENGINE_TYPE=library`

De `library` engine werkt perfect met NEON's pooler connection string en vereist geen adapter of accelerateUrl.

## Alternatieve Oplossing (als bovenstaande niet werkt)

Als de environment variable niet werkt, kun je ook Prisma Accelerate gebruiken (betaalde service):
1. Schrijf je in voor Prisma Accelerate
2. Voeg `PRISMA_ACCELERATE_URL` toe aan Vercel environment variables
3. Dit is echter een betaalde oplossing
