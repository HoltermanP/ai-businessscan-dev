# Vercel Database Migratie Instructies

## Optie 1: Automatisch (Aanbevolen)
De migraties worden automatisch uitgevoerd tijdens de volgende deployment omdat het build script is aangepast:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

Push naar GitHub en Vercel zal automatisch een nieuwe deployment maken waarbij de migraties worden uitgevoerd.

## Optie 2: Handmatig via Vercel CLI

### Stap 1: Voeg DATABASE_URL toe aan Vercel
```bash
vercel env add DATABASE_URL production
```
Voer dan de DATABASE_URL waarde in wanneer hierom wordt gevraagd.

### Stap 2: Voer migraties uit
```bash
# Haal productie environment variables op
vercel env pull .env.production --environment=production --yes

# Voer migraties uit met productie DATABASE_URL
export $(cat .env.production | grep DATABASE_URL | xargs)
npx prisma migrate deploy
```

## Optie 3: Via Vercel Dashboard

1. Ga naar je Vercel project dashboard
2. Ga naar Settings > Environment Variables
3. Voeg `DATABASE_URL` toe voor Production environment
4. De migraties worden automatisch uitgevoerd bij de volgende deployment

## Controleer migratie status
```bash
npx prisma migrate status
```
