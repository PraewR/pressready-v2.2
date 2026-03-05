import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import { PressReadyOutputSchema } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientName = (body?.clientName || "Client").toString();
    const data = PressReadyOutputSchema.parse(body?.data);

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "PressReady — Media Preparation Pack", heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Client: ${clientName}` }),
          new Paragraph({ text: "" }),

          new Paragraph({ text: "Top 12 Likely Questions", heading: HeadingLevel.HEADING_1 }),
          ...data.likely_questions.flatMap(q => [
            new Paragraph({ text: `${q.question} [${q.difficulty} | ${q.intent}]` }),
            new Paragraph({ text: `Rationale: ${q.rationale}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({ text: "Tough Questions", heading: HeadingLevel.HEADING_1 }),
          ...data.tough_questions.flatMap(q => [
            new Paragraph({ text: `${q.question} [${q.difficulty} | ${q.intent}]` }),
            new Paragraph({ text: `Rationale: ${q.rationale}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({ text: "Follow-ups & Traps", heading: HeadingLevel.HEADING_1 }),
          ...data.followups_and_traps.flatMap(f => [
            new Paragraph({ text: `Base question: ${f.base_question_id}`, heading: HeadingLevel.HEADING_2 }),
            ...f.followups.flatMap(x => [
              new Paragraph({ text: `• ${x.question} [${x.trap_type}]` }),
              new Paragraph({ text: `  Rationale: ${x.rationale}` }),
            ]),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({ text: "Narrative Stress Tests", heading: HeadingLevel.HEADING_1 }),
          ...data.narrative_stress_tests.flatMap(t => [
            new Paragraph({ text: `• ${t.test}` }),
            new Paragraph({ text: `  Probes: ${t.what_it_probes}` }),
            new Paragraph({ text: `  Framing: ${t.how_a_journalist_might_frame_it}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({ text: "Suggested Talking Points", heading: HeadingLevel.HEADING_1 }),
          ...data.suggested_talking_points.flatMap(p => [
            new Paragraph({ text: `• ${p.point}` }),
            new Paragraph({ text: `  Supports: ${p.supports_message}` }),
            new Paragraph({ text: `  Avoid: ${p.avoid}` }),
            new Paragraph({ text: "" }),
          ]),

          new Paragraph({ text: "Theme Buckets", heading: HeadingLevel.HEADING_1 }),
          ...data.theme_buckets.map(b => new Paragraph({ text: `${b.theme}: ${b.questions.join(", ")}` })),
          new Paragraph({ text: "" }),

          new Paragraph({ text: "Anchors Used (Reference Library)", heading: HeadingLevel.HEADING_1 }),
          ...data.anchors_used.slice(0, 24).map(a => new Paragraph({ text: `• ${a.question}` })),
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="PressReady-${safe(clientName)}.docx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Export failed" }, { status: 400 });
  }
}

function safe(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, "_");
}
