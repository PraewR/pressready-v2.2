import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";

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

    if (!process.env.OPENAI_API_KEY) {
      const data = generateMock(brief, anchors);
      return NextResponse.json({ ok: true, data, mode: "mock" });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.2";
    const jsonSchema = zodToJsonSchema(PressReadyOutputSchema, { $refStrategy: "none" });

    const response = await client.responses.create({
      model,
      instructions: buildInstructions(),
      input: buildUserInput(brief, anchors),
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pressready_output",
          schema: jsonSchema,
          strict: true,
        },
      },
    });

    const parsed = JSON.parse(response.output_text);

    if (!parsed.anchors_used) {
      parsed.anchors_used = anchors.map((a) => ({
        id: a.id,
        category: a.category || "",
        scenario: a.scenario || "",
        tone: a.tone || "",
        question: a.question
      }));
    }

    const validated = PressReadyOutputSchema.parse(parsed);
    return NextResponse.json({ ok: true, data: validated, mode: "ai" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Generation failed" }, { status: 400 });
  }
}
