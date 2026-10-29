import { InstrumentTuner } from "@/components/instrument-tuner";

export const dynamic = "force-dynamic";

export default function TunerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-[11px] tracking-[0.28em] text-primary uppercase">Practice</p>
      <h1 className="font-heading mt-1 text-3xl">Tuner</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Tune a guitar or bass with the microphone, then get back to the shelf.
      </p>
      <InstrumentTuner />
    </div>
  );
}
