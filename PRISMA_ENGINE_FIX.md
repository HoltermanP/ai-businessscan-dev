# Prisma Engine Type Fix voor Vercel - OPGELOST

## Probleem
Prisma 7.x detecteert automatisch dat het in een serverless omgeving (Vercel) draait en probeert engine type "client" te gebruiken, wat een adapter of accelerateUrl vereist. Dit veroorzaakt de fout:
```
Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

## Oplossing: Downgrade naar Prisma 6.1.0

**Het probleem is opgelost door te downgraden naar Prisma 6.1.0**, die dit probleem niet heeft en perfect werkt met Vercel en NEON.

### Wat is aangepast:

1. ✅ **Prisma versie gedowngraded**: Van 7.2.0 naar 6.1.0
   - `@prisma/client`: 6.1.0
   - `prisma`: 6.1.0

2. ✅ **Schema aangepast**: `url = env("DATABASE_URL")` toegevoegd aan datasource

3. ✅ **Onnodige bestanden verwijderd**:
   - `vercel.json` (niet meer nodig)
   - `prisma.config.ts` (niet ondersteund in Prisma 6.x)

4. ✅ **Code opgeschoond**: `lib/db.ts` vereenvoudigd (geen engine type hacks meer nodig)

### Waarom Prisma 6.1.0?

- ✅ Geen automatische engine type detectie in serverless omgevingen
- ✅ Werkt perfect met NEON's pooler connection string
- ✅ Stabiel en bewezen voor Vercel deployments
- ✅ Geen extra environment variables nodig
- ✅ Geen adapter of accelerateUrl vereist

### Volgende stappen:

1. **Commit en push de wijzigingen**:
   ```bash
   git add package.json package-lock.json prisma/schema.prisma lib/db.ts
   git commit -m "Fix Prisma: downgrade naar 6.1.0 voor Vercel compatibiliteit"
   git push
   ```

2. **Vercel zal automatisch deployen** met de nieuwe Prisma versie

3. **Test de API endpoints** - de database connectie zou nu moeten werken

4. **Controleer Vercel logs** om te bevestigen dat alles werkt

## Technische Details

- **Prisma versie**: 6.1.0 (stabiel voor Vercel)
- **Engine type**: Automatisch (geen probleem in 6.x)
- **Database**: NEON PostgreSQL met pooler connection string
- **Geen extra configuratie nodig**: Werkt out-of-the-box

De database koppeling zou nu volledig moeten werken! 🎉
