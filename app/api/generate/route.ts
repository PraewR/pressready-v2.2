import { NextResponse } from "next/server";
import OpenAI from "openai";
import { BriefingSchema, PressReadyOutputSchema } from "@/lib/schema";
import { retrieveAnchors } from "@/lib/retrieval";
import { buildInstructions, buildUserInput } from "@/lib/prompt";
import { generateMock } from "@/lib/mock";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const brief = BriefingSchema.parse(body);
    const anchors = retrieveAnchors(brief, 24);

    // No API key → mock mode so prototype still works
    if (!process.env.OPENAI_API_KEY) {
      const data = generateMock(brief, anchors);
      return NextResponse.json({ ok: true, data, mode: "mock" });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.2";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: buildInstructions() },
        { role: "user", content: buildUserInput(brief, anchors) },
      ],
      // Force JSON output (then we validate strictly with Zod below)
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty model response");

    const parsed = JSON.parse(content);

    // If model forgets anchors_used, inject it so the UI stays stable
    if (!parsed.anchors_used) {
      parsed.anchors_used = anchors.map((a) => ({
        id: a.id,
        category: a.category || "",
        scenario: a.scenario || "",
        tone: a.tone || "",
        question: a.question,
      }));
    }

    const validated = PressReadyOutputSchema.parse(parsed);
    return NextResponse.json({ ok: true, data: validated, mode: "ai" });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Generation failed" },
      { status: 400 }
    );
  }
}
