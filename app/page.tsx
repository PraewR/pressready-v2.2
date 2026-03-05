"use client";

import { useMemo, useState } from "react";
import { compressToEncodedURIComponent } from "lz-string";
import type { PressReadyOutput } from "@/lib/schema";

const COUNTRIES = ["Thailand", "Singapore", "Vietnam", "Indonesia", "Philippines"] as const;

type BriefingState = {
  clientName: string;
  industry: string;
  country: string;
  announcementTopic: string;
  keyMessages: string;
  mediaOutlet: string;
  journalistName?: string;
  sensitiveIssues: string;
  interviewFormat: string;
};

const initial: BriefingState = {
  clientName: "",
  industry: "",
  country: "",
  announcementTopic: "",
  keyMessages: "",
  mediaOutlet: "",
  journalistName: "",
  sensitiveIssues: "",
  interviewFormat: "1:1 interview",
};

const TABS = [
  { key: "likely", label: "Likely Questions" },
  { key: "tough", label: "Tough Questions" },
  { key: "followups", label: "Follow-ups & Traps" },
  { key: "stress", label: "Stress Tests" },
  { key: "talking", label: "Talking Points" },
  { key: "themes", label: "Theme Buckets" },
  { key: "anchors", label: "Anchors Used" },
] as const;

export default function Page() {
  const [brief, setBrief] = useState<BriefingState>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PressReadyOutput | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("likely");
  const [mode, setMode] = useState<"ai" | "mock" | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    return (
      brief.clientName.trim() &&
      brief.industry.trim() &&
      brief.country.trim() &&
      brief.announcementTopic.trim() &&
      brief.keyMessages.trim() &&
      brief.mediaOutlet.trim() &&
      brief.sensitiveIssues.trim() &&
      brief.interviewFormat.trim()
    );
  }, [brief]);

  function update<K extends keyof BriefingState>(key: K, val: BriefingState[K]) {
    setBrief((b) => ({ ...b, [key]: val }));
  }

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setShareUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Generation failed");
      setResult(json.data);
      setMode(json.mode || null);
      setTab("likely");
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function exportJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ brief, result }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pressready-${safe(brief.clientName || "prototype")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportDocx() {
    if (!result) return;
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

  function makeShareLink() {
    if (!result) return;
    const payload = { brief, result, createdAt: new Date().toISOString() };
    const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
    const url = `${window.location.origin}/share#data=${encoded}`;
    setShareUrl(url);
    navigator.clipboard?.writeText(url).catch(() => {});
  }

  return (
    <main className="container">
      <div className="header">
        <div className="h1">PressReady V2 — Prototype</div>
        <div className="sub">
          กรอก briefing → กด <b>Generate</b> → ได้ likely/tough questions + stress tests + talking points พร้อม export และ share link
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="badge">Country = ชื่อชีทใน Library</span>
            <span className="badge">มี OPENAI_API_KEY = AI จริง · ไม่มี key = Mock</span>
            <span className="badge">Export DOCX · Print to PDF · Share Link</span>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="field">
          <label>Client name</label>
          <input value={brief.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="เช่น Delta Electronics" />
        </div>

        <div className="field">
          <label>Industry</label>
          <input value={brief.industry} onChange={(e) => update("industry", e.target.value)} placeholder="เช่น Data Center, Energy, Finance" />
        </div>

        <div className="field">
          <label>Country</label>
          <select value={brief.country} onChange={(e) => update("country", e.target.value)}>
            <option value="" disabled>เลือกประเทศ</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Media outlet</label>
          <input value={brief.mediaOutlet} onChange={(e) => update("mediaOutlet", e.target.value)} placeholder="เช่น The Standard, Bloomberg, Tech in Asia" />
        </div>

        <div className="field">
          <label>Journalist name (optional)</label>
          <input value={brief.journalistName ?? ""} onChange={(e) => update("journalistName", e.target.value)} placeholder="เช่น Jane Doe" />
        </div>

        <div className="field">
          <label>Interview format</label>
          <input value={brief.interviewFormat} onChange={(e) => update("interviewFormat", e.target.value)} placeholder="เช่น 1:1, Panel, Press conference" />
        </div>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Announcement topic</label>
        <textarea value={brief.announcementTopic} onChange={(e) => update("announcementTopic", e.target.value)} placeholder="อธิบาย announcement 2–4 ประโยค" />
      </div>

      <div className="field">
        <label>Key messages</label>
        <textarea value={brief.keyMessages} onChange={(e) => update("keyMessages", e.target.value)} placeholder="ใส่ bullet ได้ · ใส่ proof points ถ้ามี" />
      </div>

      <div className="field">
        <label>Sensitive issues</label>
        <textarea value={brief.sensitiveIssues} onChange={(e) => update("sensitiveIssues", e.target.value)} placeholder="เช่น ราคา, ความปลอดภัย, กฎหมาย, ethics, privacy, layoffs ฯลฯ" />
      </div>

      <div className="row">
        <button className="btn primary" disabled={loading || !canGenerate} onClick={onGenerate}>
          {loading ? "Generating..." : "Generate"}
        </button>
        <button className="btn" disabled={!result} onClick={exportDocx}>Export DOCX</button>
        <button className="btn" disabled={!result} onClick={() => window.print()}>Print to PDF</button>
        <button className="btn" disabled={!result} onClick={exportJson}>Export JSON</button>
        <button className="btn" disabled={!result} onClick={makeShareLink}>Share link</button>
        {mode && <span className="pill">Mode: {mode === "ai" ? "AI" : "Mock"}</span>}
      </div>

      {shareUrl && (
        <div className="card">
          <div className="h2">Share Link (คัดลอกแล้ว)</div>
          <div className="small">เปิดลิงก์นี้เพื่อดูผลลัพธ์แบบ read-only:</div>
          <div style={{ marginTop: 8, wordBreak: "break-all" }}><span className="kbd">{shareUrl}</span></div>
          <div className="small" style={{ marginTop: 8 }}>
            *ลิงก์แบบนี้เก็บข้อมูลไว้ใน URL (ไม่ต้องใช้ database) เหมาะสำหรับ prototype/demo
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {result && (
        <section className="card">
          <div className="h2">Results</div>
          <div className="small">
            <b>Client:</b> {brief.clientName} · <b>Industry:</b> {brief.industry} · <b>Country:</b> {brief.country} · <b>Outlet:</b> {brief.mediaOutlet}
          </div>

          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={"tab" + (tab === t.key ? " active" : "")}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "likely" && (
            <Section title="Top 12 Likely Journalist Questions">
              {result.likely_questions.map((q) => (
                <QuestionCard key={q.id} q={q} />
              ))}
            </Section>
          )}

          {tab === "tough" && (
            <Section title="Tough Questions (Pressure Test)">
              {result.tough_questions.map((q) => (
                <QuestionCard key={q.id} q={q} />
              ))}
            </Section>
          )}

          {tab === "followups" && (
            <Section title="Follow-ups & Traps">
              {result.followups_and_traps.map((f, idx) => (
                <div key={idx} className="q">
                  <div className="qtitle">Base question: {f.base_question_id}</div>
                  <div className="qrationale">
                    <ul style={{ margin: "8px 0 0 18px" }}>
                      {f.followups.map((x, j) => (
                        <li key={j} style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 900 }}>
                            {x.question} <span className="pill">{x.trap_type}</span>
                          </div>
                          <div className="small">{x.rationale}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {tab === "stress" && (
            <Section title="Narrative Stress Tests">
              {result.narrative_stress_tests.map((t, idx) => (
                <div key={idx} className="q">
                  <div className="qtitle">{t.test}</div>
                  <div className="qrationale"><b>Probes:</b> {t.what_it_probes}</div>
                  <div className="qrationale"><b>Likely framing:</b> {t.how_a_journalist_might_frame_it}</div>
                </div>
              ))}
            </Section>
          )}

          {tab === "talking" && (
            <Section title="Suggested Talking Points">
              {result.suggested_talking_points.map((p, idx) => (
                <div key={idx} className="q">
                  <div className="qtitle">• {p.point}</div>
                  <div className="qrationale"><b>Supports:</b> {p.supports_message}</div>
                  <div className="qrationale"><b>Avoid:</b> {p.avoid}</div>
                </div>
              ))}
            </Section>
          )}

          {tab === "themes" && (
            <Section title="Theme Buckets">
              {result.theme_buckets.map((b, idx) => (
                <div key={idx} className="q">
                  <div className="qtitle">{b.theme}</div>
                  <div className="qrationale">{b.questions.join(", ")}</div>
                </div>
              ))}
            </Section>
          )}

          {tab === "anchors" && (
            <Section title="Anchors Used (from Question Library)">
              <details open>
                <summary className="small" style={{ cursor: "pointer" }}>
                  แสดง reference questions ที่ใช้ ({result.anchors_used.length})
                </summary>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {result.anchors_used.slice(0, 20).map((a) => (
                    <div key={a.id} className="q">
                      <div className="qtitle">{a.question}</div>
                      <div className="small"><b>Category:</b> {a.category || "—"} · <b>Scenario:</b> {a.scenario || "—"} · <b>Tone:</b> {a.tone || "—"}</div>
                    </div>
                  ))}
                </div>
              </details>
            </Section>
          )}
        </section>
      )}

      <footer style={{ marginTop: 18 }} className="small">
        <b>Deploy tip:</b> Vercel → Settings → Environment Variables → ตั้ง <span className="kbd">OPENAI_API_KEY</span> (optional <span className="kbd">OPENAI_MODEL</span>)
      </footer>
    </main>
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

function QuestionCard({ q }: { q: any }) {
  return (
    <div className="q">
      <div className="qtitle">
        {q.question}{" "}
        <span className="pill">{q.id}</span>{" "}
        <span className="pill">{q.difficulty}</span>{" "}
        <span className="pill">{q.intent}</span>
      </div>
      <div className="qrationale">{q.rationale}</div>
    </div>
  );
}

function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
