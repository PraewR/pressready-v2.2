"use client";

import { useEffect, useState } from "react";
import { decompressFromEncodedURIComponent } from "lz-string";
import type { PressReadyOutput } from "@/lib/schema";

type Payload = { brief: any; result: PressReadyOutput; createdAt: string };

export default function SharePage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hash = window.location.hash || "";
      const m = hash.match(/data=([^&]+)/);
      if (!m) throw new Error("Missing share data in URL.");
      const raw = decompressFromEncodedURIComponent(m[1]);
      if (!raw) throw new Error("Unable to decode share data.");
      setPayload(JSON.parse(raw));
    } catch (e: any) {
      setError(e?.message ?? "Invalid share link");
    }
  }, []);

  return (
    <main className="container">
      <div className="header">
        <div className="h1">PressReady — Shared Result</div>
        <div className="sub">Read-only view. Export DOCX or print to PDF.</div>
      </div>

      {error && <div className="error">{error}</div>}
      {payload && <ResultView brief={payload.brief} result={payload.result} />}
    </main>
  );
}

function ResultView({ brief, result }: { brief: any; result: PressReadyOutput }) {
  async function exportDocx() {
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName: brief.clientName || "Client", data: result }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PressReady-${safe(brief.clientName || "Client")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card">
      <div className="h2">Brief Summary</div>
      <div className="small">
        <b>Client:</b> {brief.clientName} · <b>Industry:</b> {brief.industry} · <b>Country:</b> {brief.country} · <b>Outlet:</b> {brief.mediaOutlet}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={exportDocx}>Export DOCX</button>
        <button className="btn" onClick={() => window.print()}>Print to PDF</button>
      </div>

      <hr />

      <Section title="Top 12 Likely Questions">
        {result.likely_questions.map((q) => <Q key={q.id} q={q} />)}
      </Section>

      <Section title="Tough Questions">
        {result.tough_questions.map((q) => <Q key={q.id} q={q} />)}
      </Section>

      <Section title="Anchors Used (Question Library)">
        <details>
          <summary className="small" style={{ cursor: "pointer" }}>
            View {result.anchors_used.length} reference questions
          </summary>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {result.anchors_used.slice(0, 20).map(a => (
              <div key={a.id} className="q">
                <div className="qtitle">{a.question}</div>
                <div className="small"><b>Category:</b> {a.category || "—"} · <b>Scenario:</b> {a.scenario || "—"} · <b>Tone:</b> {a.tone || "—"}</div>
              </div>
            ))}
          </div>
        </details>
      </Section>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <div className="h2">{title}</div>
      {children}
    </div>
  );
}

function Q({ q }: { q: any }) {
  return (
    <div className="q">
      <div className="qtitle">
        {q.question} <span className="pill">{q.id}</span> <span className="pill">{q.difficulty}</span> <span className="pill">{q.intent}</span>
      </div>
      <div className="qrationale">{q.rationale}</div>
    </div>
  );
}

function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
