-- HusKlar: adgangskoder til rapport-analyse
-- Kør denne SQL én gang i Supabase SQL editor efter oprettelse af projektet.
-- Nøglen DATABASE_URL findes under Project Settings → Database → Connection string (Session pooler, port 5432).

CREATE TABLE IF NOT EXISTS codes (
  code        TEXT PRIMARY KEY,
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at     TIMESTAMPTZ,
  note        TEXT
);

-- Partiel indeks: optimér for hurtig opslag af ubrugte koder (typisk den mest hyppige forespørgsel)
CREATE INDEX IF NOT EXISTS idx_codes_is_used ON codes(is_used) WHERE is_used = FALSE;

-- Eksempel-forespørgsler:
--   Koder oprettet i dag:          SELECT count(*) FROM codes WHERE created_at::date = CURRENT_DATE;
--   Ubrugte koder:                 SELECT code, note, created_at FROM codes WHERE is_used = FALSE ORDER BY created_at DESC;
--   Brugt i sidste 7 dage:         SELECT count(*) FROM codes WHERE used_at > NOW() - INTERVAL '7 days';
