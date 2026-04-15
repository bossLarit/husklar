export type PhaseId =
  | "before-bid"
  | "at-viewing"
  | "before-signing"
  | "after-signing";

export interface ChecklistItem {
  id: string;
  label: string;
  note?: string;
  checked: boolean;
  custom?: boolean;
}

export interface ChecklistPhase {
  id: PhaseId;
  title: string;
  subtitle: string;
  items: ChecklistItem[];
}

export interface Checklist {
  version: 1;
  phases: ChecklistPhase[];
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}-${Date.now()}`;
}

function item(label: string): ChecklistItem {
  return { id: newId("chk"), label, checked: false };
}

export function defaultChecklist(): Checklist {
  return {
    version: 1,
    phases: [
      {
        id: "before-bid",
        title: "Før budgivning",
        subtitle: "Research, dokumenter og økonomi inden du byder",
        items: [
          item("Læs tilstandsrapporten grundigt — bemærk K3-karakterer (alvorlige skader)"),
          item("Læs elinstallationsrapporten — bemærk røde og gule markeringer"),
          item("Tjek energimærke — karakter A–G, gyldigt 10 år"),
          item("Hent BBR-meddelelse fra BBR.dk — sammenlign areal med salgsopstilling"),
          item("Hent ejendomsdatarapport fra boligejer.dk — jordforurening, lokalplan, servitutter, varmeforsyning"),
          item("Hent tingbogsattest fra tinglysning.dk — pant, servitutter, ejerforhold"),
          item("Spørg kommunen om forfaldne krav, byggesager og forestående renoveringer"),
          item("Hent ejerforening / grundejerforening: vedtægter, regnskab, referater, husorden"),
          item("Tjek liggetid og prisnedsættelse på boliga.dk"),
          item("Sammenlign kontantpris og kr/m² med sammenlignelige salg i området"),
          item("Indhent 3+ lånetilbud fra forskellige banker — sammenlign ÅOP (ikke nominel rente)"),
          item("Tjek bidragssats og kurtage i lånetilbuddene"),
          item("Beregn max belåning med HusKlar låneberegner"),
          item("Beregn årlig ejerudgift med HusKlar omkostnings-beregner"),
        ],
      },
      {
        id: "at-viewing",
        title: "Ved fremvisning",
        subtitle: "Hvad du selv skal tjekke og spørge om",
        items: [
          item("Tjek vinduer for dug, rådne rammer og utæt kit"),
          item("Tjek el-tavle, sikringer og kabler (synligt arbejde uden autorisation?)"),
          item("Tjek lofter og kælder for fugtskjolder og skimmel"),
          item("Prøv alle vandhaner, brusere og toiletter"),
          item("Lyt til støj i 5 minutter (trafik, naboer)"),
          item("Spørg om sælgers grund til salg"),
          item("Spørg om seneste renoveringer og garantier på håndværkerarbejde"),
          item("Spørg om naboer og eventuelle tvister"),
          item("Tag billeder af skjulte steder (bag sofa, i skabe, under tagryg)"),
          item("Bed om seneste 12 måneders forbrugsregninger (el, vand, varme)"),
        ],
      },
      {
        id: "before-signing",
        title: "Før underskrift",
        subtitle: "Advokat, bank og forbehold",
        items: [
          item("Gennemgå købsaftalen med advokat"),
          item("Indsæt advokatforbehold (6 hverdage til godkendelse, gebyrfri udtræden)"),
          item("Indsæt bankforbehold — lånetilbuddet skal være endeligt"),
          item("Overvej byggeteknisk forbehold hvis tilstandsrapporten har røde punkter"),
          item("Bank-godkendelse af lån med fast kurs-aftale"),
          item("Indhent og sammenlign ejerskifteforsikring-tilbud (sælger skal tilbyde og betale halvdelen)"),
          item("Verificér tingbogsattest — ingen uventede pant eller servitutter"),
          item("Tjek refusions-aftalen — skæringsdag = overtagelsesdag"),
          item("Huk 6-hverdages fortrydelsesret (gebyr 1 % af kontantprisen ved fortrydelse)"),
        ],
      },
      {
        id: "after-signing",
        title: "Efter underskrift",
        subtitle: "Frem til overtagelsesdagen",
        items: [
          item("Bestil flyttefirma i god tid"),
          item("Opsig nuværende bolig (typisk ≥3 mdr. opsigelse)"),
          item("Flyt forsyninger: el, vand, varme, internet"),
          item("Adresseændring på borger.dk"),
          item("Tegn indbo- og bygningsforsikring med effekt fra overtagelsesdatoen"),
          item("Tjek boligen ved aflevering mod salgsopstillingens beskrivelse"),
          item("Verificér refusionsopgørelse fra advokaten (sælger skylder / køber skylder)"),
          item("Underskriv skøde digitalt"),
          item("Gem alle papirer — også til eventuelt fremtidigt salg"),
        ],
      },
    ],
  };
}

export function countProgress(checklist: Checklist): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const phase of checklist.phases) {
    for (const it of phase.items) {
      total += 1;
      if (it.checked) done += 1;
    }
  }
  return { done, total };
}
