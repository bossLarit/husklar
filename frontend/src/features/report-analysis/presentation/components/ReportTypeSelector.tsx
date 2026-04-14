import type { ReportType } from "../../domain/entities/report";

interface ReportTypeSelectorProps {
  value: ReportType;
  onChange: (type: ReportType) => void;
}

export function ReportTypeSelector({ value, onChange }: ReportTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      <TypeButton
        label="Tilstandsrapport"
        active={value === "tilstandsrapport"}
        onClick={() => onChange("tilstandsrapport")}
      />
      <TypeButton
        label="Elrapport"
        active={value === "elrapport"}
        onClick={() => onChange("elrapport")}
      />
    </div>
  );
}

function TypeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-input bg-card text-muted-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}
