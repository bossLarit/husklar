# Database setup — HusKlar adgangskoder

HusKlar bruger Supabase Postgres til at opbevare engangs-adgangskoder til rapport-analyse. Følg disse trin én gang:

## 1. Opret Supabase-projekt (gratis)

1. Gå til [supabase.com](https://supabase.com) og opret en konto.
2. Klik "New project". Noter et stærkt database-password (gemmes ikke af Supabase, så skriv det ned).
3. Vælg en region tæt på Render (fx "Frankfurt").

## 2. Kør SQL-schema

1. Åbn projektet → **SQL Editor** → **New query**.
2. Kopiér indholdet af `001_codes.sql` fra denne mappe og kør det.
3. Bekræft at `codes`-tabellen findes under **Table Editor**.

## 3. Hent connection string

1. Gå til **Project Settings** → **Database**.
2. Under "Connection string" → "Session pooler" (port 5432) → kopiér URI.
3. Erstat `[YOUR-PASSWORD]` med dit database-password fra trin 1.

## 4. Sæt env vars i Render backend

Gå til [dashboard.render.com](https://dashboard.render.com) → din HusKlar-service → Environment:

| Key              | Værdi                                                         |
|------------------|---------------------------------------------------------------|
| `DATABASE_URL`   | Supabase URI fra trin 3                                       |
| `MASTER_PASSWORD`| Stærkt kodeord til admin-siden (fx 20+ tegn, brug 1Password)  |

`REPORT_ACCESS_CODE` (eksisterende owner-kode) beholdes uændret — den virker som ubegrænset ejer-kode.

Render deployer automatisk efter env vars opdateres.

## 5. Generér dine første koder

1. Gå til `https://bosslarit.github.io/husklar/admin`
2. Indtast `MASTER_PASSWORD`, vælg antal, tilføj evt. note ("til Sarah")
3. Kopiér koderne og send manuelt (MobilePay-chat, SMS, i hånden)

## Nyttige SQL-forespørgsler

Åbn Supabase SQL editor:

```sql
-- Ubrugte koder
SELECT code, note, created_at FROM codes WHERE is_used = FALSE ORDER BY created_at DESC;

-- Brugt i sidste 7 dage
SELECT count(*) FROM codes WHERE used_at > NOW() - INTERVAL '7 days';

-- Hvem har brugt hvad
SELECT code, note, used_at FROM codes WHERE is_used = TRUE ORDER BY used_at DESC;
```

## Graceful degradation

Hvis `DATABASE_URL` ikke er sat, starter backend alligevel. Den eksisterende
`REPORT_ACCESS_CODE` (owner-kode) virker som før. Kun genererede koder kræver
databasen — så du kan deploye koden før Supabase er oppe.
