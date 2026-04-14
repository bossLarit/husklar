import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";

const features = [
  {
    title: "Rapport-analyse",
    description:
      "Upload din tilstandsrapport eller elrapport. AI analyserer kritiske fejl, estimerer omkostninger og forklarer fagudtryk i et sprog du forstår.",
    to: "/rapport",
    icon: DocumentIcon,
  },
  {
    title: "Låneberegner",
    description:
      "Forstå din reelle købekraft. Beregn max belåning, månedlig ydelse og se om du består bankens stresstest.",
    to: "/laaneberegner",
    icon: CalculatorIcon,
  },
  {
    title: "Omgivelsesanalyse",
    description:
      "Se skoler, transport, støjniveau og tryghed omkring boligen. Få en samlet score for området.",
    to: "/omgivelser",
    icon: MapIcon,
  },
] as const;

export function LandingPage() {
  useDocumentTitle("Din guide til boligkøb");
  return (
    <div className="flex flex-col gap-16 py-8 md:py-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Er du <span className="text-primary">klar</span> til at købe bolig?
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          HusKlar hjælper førstegangskøbere med at forstå rapporter, beregne lån
          og udforske omgivelserne — samlet ét sted, helt gratis.
        </p>
        <div className="flex gap-3">
          <Link
            to="/rapport"
            className="inline-flex h-11 cursor-pointer items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
          >
            Analysér rapport
          </Link>
          <Link
            to="/laaneberegner"
            className="inline-flex h-11 cursor-pointer items-center rounded-md border border-input bg-card px-6 text-sm font-medium transition-colors duration-200 hover:bg-secondary"
          >
            Beregn lån
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="group cursor-pointer rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <feature.icon />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{feature.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </Link>
        ))}
      </section>

      {/* Trust / disclaimer */}
      <section className="text-center text-sm text-muted-foreground">
        <p>
          HusKlar er et vejledende værktøj og erstatter ikke professionel
          rådgivning fra bank, advokat eller byggesagkyndig.
        </p>
      </section>
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 7 6-3 6 3 6-3v13l-6 3-6-3-6 3Z" />
      <path d="M9 4v13" />
      <path d="M15 7v13" />
    </svg>
  );
}
