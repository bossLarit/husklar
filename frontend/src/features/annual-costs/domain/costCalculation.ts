export type BoligType = "hus" | "raekkehus" | "ejerlejlighed" | "fritidsbolig";

export interface CostInputs {
  kontantpris: number;
  ejendomsvaerdi?: number;
  grundvaerdi?: number;
  boligType: BoligType;
  boligStoerrelseM2: number;
  byggeaar: number;
  antalPersoner: number;
  grundskyldPromille?: number;
  laanebeloeb?: number;
  grundejerforening?: number;
}

export interface AnnualCostBreakdown {
  ejendomsvaerdiskat: number;
  grundskyld: number;
  el: number;
  vand: number;
  varme: number;
  bygningsforsikring: number;
  vedligehold: number;
  grundejerforening: number;
  total: number;
}

export interface OneTimeCostBreakdown {
  tinglysningSkoede: number;
  tinglysningPantebrev: number;
  vurderingsgebyr: number;
  laanesagsgebyr: number;
  kurtage: number;
  advokat: number;
  total: number;
}

// Satser — pr. 2024/2026. Opdateres når reglerne ændrer sig.
// Kilder: bankraadgiver.md, advokat.md, skat.dk/boligejer.dk
export const SATSER = {
  // Ejendomsværdiskat (2024-regler via .claude/skills/bankraadgiver.md)
  EJENDOMSVAERDISKAT_LAV_PROCENT: 0.0051,
  EJENDOMSVAERDISKAT_HOJ_PROCENT: 0.014,
  EJENDOMSVAERDISKAT_GRAENSE_KR: 9_400_000,

  // Grundskyld (varierer 16–34 ‰ pr. kommune, default landsgennemsnit)
  GRUNDSKYLD_DEFAULT_PROMILLE: 24,

  // Forbrug — estimater
  EL_KWH_PER_PERSON_AAR: 1500,
  EL_PRIS_KR_KWH: 3,
  VAND_M3_PER_PERSON_AAR: 40,
  VAND_PRIS_KR_M3: 65,
  VARME_KWH_M2_HUS_FOER_1980: 150,
  VARME_KWH_M2_HUS_EFTER_1980: 80,
  VARME_KWH_M2_LEJLIGHED: 100,
  VARME_PRIS_KR_KWH: 1,

  // Forsikring
  FORSIKRING_HUS_KR_AAR: 4_000,
  FORSIKRING_LEJLIGHED_KR_AAR: 2_500,

  // Vedligehold (faustregel: 1% af boligværdi pr. år for hus)
  VEDLIGEHOLD_HUS_PROCENT: 0.01,
  VEDLIGEHOLD_LEJLIGHED_PROCENT: 0.003,

  // Engangsomkostninger (2026)
  TINGLYSNING_SKOEDE_PROCENT: 0.006,
  TINGLYSNING_PANTEBREV_PROCENT: 0.0145,
  TINGLYSNING_FAST_GEBYR_KR: 1_850,
  VURDERINGSGEBYR_KR: 4_500,
  LAANESAGSGEBYR_KR: 7_500,
  KURTAGE_PROCENT: 0.0022,
  ADVOKAT_KR: 10_000,
} as const;

function isLejlighed(type: BoligType): boolean {
  return type === "ejerlejlighed";
}

export function calculateEjendomsvaerdiskat(
  ejendomsvaerdi: number,
): number {
  if (ejendomsvaerdi <= 0) return 0;
  const g = SATSER.EJENDOMSVAERDISKAT_GRAENSE_KR;
  if (ejendomsvaerdi <= g) {
    return ejendomsvaerdi * SATSER.EJENDOMSVAERDISKAT_LAV_PROCENT;
  }
  return (
    g * SATSER.EJENDOMSVAERDISKAT_LAV_PROCENT +
    (ejendomsvaerdi - g) * SATSER.EJENDOMSVAERDISKAT_HOJ_PROCENT
  );
}

export function calculateVarme(
  boligType: BoligType,
  m2: number,
  byggeaar: number,
): number {
  if (m2 <= 0) return 0;
  let kwhPerM2: number;
  if (isLejlighed(boligType)) {
    kwhPerM2 = SATSER.VARME_KWH_M2_LEJLIGHED;
  } else {
    kwhPerM2 =
      byggeaar < 1980
        ? SATSER.VARME_KWH_M2_HUS_FOER_1980
        : SATSER.VARME_KWH_M2_HUS_EFTER_1980;
  }
  return m2 * kwhPerM2 * SATSER.VARME_PRIS_KR_KWH;
}

export function calculateAnnualCosts(inputs: CostInputs): AnnualCostBreakdown {
  const ejendomsvaerdiForSkat = inputs.ejendomsvaerdi ?? inputs.kontantpris;
  const grundvaerdi = inputs.grundvaerdi ?? 0;
  const promille = inputs.grundskyldPromille ?? SATSER.GRUNDSKYLD_DEFAULT_PROMILLE;

  const ejendomsvaerdiskat = calculateEjendomsvaerdiskat(ejendomsvaerdiForSkat);
  const grundskyld = isLejlighed(inputs.boligType)
    ? 0
    : (grundvaerdi * promille) / 1000;

  const el =
    inputs.antalPersoner *
    SATSER.EL_KWH_PER_PERSON_AAR *
    SATSER.EL_PRIS_KR_KWH;

  const vand =
    inputs.antalPersoner *
    SATSER.VAND_M3_PER_PERSON_AAR *
    SATSER.VAND_PRIS_KR_M3;

  const varme = calculateVarme(
    inputs.boligType,
    inputs.boligStoerrelseM2,
    inputs.byggeaar,
  );

  const bygningsforsikring = isLejlighed(inputs.boligType)
    ? SATSER.FORSIKRING_LEJLIGHED_KR_AAR
    : SATSER.FORSIKRING_HUS_KR_AAR;

  const vedligeholdSats = isLejlighed(inputs.boligType)
    ? SATSER.VEDLIGEHOLD_LEJLIGHED_PROCENT
    : SATSER.VEDLIGEHOLD_HUS_PROCENT;
  const vedligehold = inputs.kontantpris * vedligeholdSats;

  const grundejerforening = inputs.grundejerforening ?? 0;

  const total =
    ejendomsvaerdiskat +
    grundskyld +
    el +
    vand +
    varme +
    bygningsforsikring +
    vedligehold +
    grundejerforening;

  return {
    ejendomsvaerdiskat: Math.round(ejendomsvaerdiskat),
    grundskyld: Math.round(grundskyld),
    el: Math.round(el),
    vand: Math.round(vand),
    varme: Math.round(varme),
    bygningsforsikring: Math.round(bygningsforsikring),
    vedligehold: Math.round(vedligehold),
    grundejerforening: Math.round(grundejerforening),
    total: Math.round(total),
  };
}

export function calculateOneTimeCosts(inputs: CostInputs): OneTimeCostBreakdown {
  const laan = inputs.laanebeloeb ?? 0;

  const tinglysningSkoede =
    inputs.kontantpris * SATSER.TINGLYSNING_SKOEDE_PROCENT +
    SATSER.TINGLYSNING_FAST_GEBYR_KR;

  const tinglysningPantebrev =
    laan > 0
      ? laan * SATSER.TINGLYSNING_PANTEBREV_PROCENT +
        SATSER.TINGLYSNING_FAST_GEBYR_KR
      : 0;

  const kurtage = laan * SATSER.KURTAGE_PROCENT;
  const vurderingsgebyr = laan > 0 ? SATSER.VURDERINGSGEBYR_KR : 0;
  const laanesagsgebyr = laan > 0 ? SATSER.LAANESAGSGEBYR_KR : 0;
  const advokat = SATSER.ADVOKAT_KR;

  const total =
    tinglysningSkoede +
    tinglysningPantebrev +
    kurtage +
    vurderingsgebyr +
    laanesagsgebyr +
    advokat;

  return {
    tinglysningSkoede: Math.round(tinglysningSkoede),
    tinglysningPantebrev: Math.round(tinglysningPantebrev),
    vurderingsgebyr: Math.round(vurderingsgebyr),
    laanesagsgebyr: Math.round(laanesagsgebyr),
    kurtage: Math.round(kurtage),
    advokat: Math.round(advokat),
    total: Math.round(total),
  };
}

export const BOLIG_TYPE_LABEL: Record<BoligType, string> = {
  hus: "Hus / villa",
  raekkehus: "Rækkehus",
  ejerlejlighed: "Ejerlejlighed",
  fritidsbolig: "Fritidsbolig",
};
