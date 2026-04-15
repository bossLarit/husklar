import type { ReactNode } from "react";
import type { BoligType, CostInputs } from "../../domain/costCalculation";
import { BOLIG_TYPE_LABEL, SATSER } from "../../domain/costCalculation";

interface Props {
  inputs: CostInputs;
  onChange: (inputs: CostInputs) => void;
}

export function CostForm({ inputs, onChange }: Props) {
  const set = <K extends keyof CostInputs>(key: K, value: CostInputs[K]) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6"
      onSubmit={(e) => e.preventDefault()}
    >
      <NumberField
        label="Kontantpris"
        suffix="kr"
        value={inputs.kontantpris}
        placeholder="3.000.000"
        onChange={(n) => set("kontantpris", n ?? 0)}
      />

      <NumberField
        label="Offentlig ejendomsværdi"
        suffix="kr"
        value={inputs.ejendomsvaerdi}
        optional
        placeholder="Bruges til ejendomsværdiskat"
        hint={
          <>
            Find den på{" "}
            <a
              href="https://vurdering.skat.dk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              vurdering.skat.dk
            </a>
            . Tomt felt: bruger kontantpris.
          </>
        }
        onChange={(n) => set("ejendomsvaerdi", n)}
      />

      <NumberField
        label="Grundværdi"
        suffix="kr"
        value={inputs.grundvaerdi}
        optional
        placeholder="Bruges til grundskyld"
        hint={
          <>
            Offentlig vurdering af grunden fra{" "}
            <a
              href="https://vurdering.skat.dk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              vurdering.skat.dk
            </a>
          </>
        }
        onChange={(n) => set("grundvaerdi", n)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="boligType">
          Boligtype
        </label>
        <select
          id="boligType"
          value={inputs.boligType}
          onChange={(e) => set("boligType", e.target.value as BoligType)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring"
        >
          {(Object.keys(BOLIG_TYPE_LABEL) as BoligType[]).map((k) => (
            <option key={k} value={k}>
              {BOLIG_TYPE_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          label="Boligstørrelse"
          suffix="m²"
          value={inputs.boligStoerrelseM2}
          placeholder="140"
          hint={
            <>
              BBR-areal fra{" "}
              <a
                href="https://bbr.dk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                bbr.dk
              </a>
              {" "}— mæglerens m² kan afvige.
            </>
          }
          onChange={(n) => set("boligStoerrelseM2", n ?? 0)}
        />

        <NumberField
          label="Byggeår"
          suffix=""
          value={inputs.byggeaar}
          placeholder="1975"
          onChange={(n) => set("byggeaar", n ?? new Date().getFullYear())}
        />

        <NumberField
          label="Antal personer"
          suffix=""
          value={inputs.antalPersoner}
          placeholder="2"
          onChange={(n) => set("antalPersoner", n ?? 1)}
        />

        <NumberField
          label="Grundskyld"
          suffix="‰"
          value={inputs.grundskyldPromille}
          optional
          placeholder={String(SATSER.GRUNDSKYLD_DEFAULT_PROMILLE)}
          hint={`Varierer 16–34 ‰ pr. kommune. Default ${SATSER.GRUNDSKYLD_DEFAULT_PROMILLE} ‰.`}
          onChange={(n) => set("grundskyldPromille", n)}
        />
      </div>

      <NumberField
        label="Lånebeløb"
        suffix="kr"
        value={inputs.laanebeloeb}
        optional
        placeholder="Bruges til engangsomkostninger"
        hint="Typisk 80 % af kontantprisen ved realkredit."
        onChange={(n) => set("laanebeloeb", n)}
      />

      <NumberField
        label="Grundejer- / ejerforening"
        suffix="kr/år"
        value={inputs.grundejerforening}
        optional
        placeholder="0"
        onChange={(n) => set("grundejerforening", n)}
      />
    </form>
  );
}

interface NumberFieldProps {
  label: string;
  suffix: string;
  value: number | undefined;
  placeholder: string;
  optional?: boolean;
  hint?: ReactNode;
  onChange: (next: number | undefined) => void;
}

function NumberField({
  label,
  suffix,
  value,
  placeholder,
  optional,
  hint,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-muted-foreground">(valgfri)</span>
        )}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            if (e.target.value === "") {
              onChange(undefined);
              return;
            }
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : undefined);
          }}
          className="h-10 w-full rounded-md border border-border bg-background px-3 pr-14 text-sm tabular-nums outline-none focus:border-ring"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
