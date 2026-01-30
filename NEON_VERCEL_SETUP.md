# Neon Database Setup voor Vercel

## Belangrijk voor Serverless Omgevingen

Voor Neon database in Vercel (serverless) moet je de **pooler connection string** gebruiken, niet de direct connection string.

## Connection String Formaat

De DATABASE_URL moet de volgende parameters bevatten voor optimale performance in serverless:

```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connect_timeout=10
```

### Belangrijke parameters:
- **pooler** in de hostname (niet direct connection)
- **pgbouncer=true** - voor connection pooling
- **connect_timeout=10** - timeout voor connections
- **sslmode=require** - SSL vereist

## Controleren in Vercel

1. Ga naar je Vercel project dashboard
2. Ga naar Settings > Environment Variables
3. Controleer of `DATABASE_URL` de pooler connection string gebruikt
4. Zorg dat de connection string eindigt met `?sslmode=require&pgbouncer=true&connect_timeout=10`

## Als de connection string niet correct is:

1. Ga naar je Neon dashboard
2. Selecteer je database
3. Ga naar "Connection Details"
4. Kies "Pooled connection" (niet "Direct connection")
5. Kopieer de connection string
6. Voeg toe aan Vercel environment variables

## Testen

Na het instellen van de juiste connection string:
1. Trigger een nieuwe deployment in Vercel
2. Test de `/api/full-scan` endpoint
3. Check de logs in Vercel dashboard voor eventuele errors
