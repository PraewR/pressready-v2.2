import library from "@/data/question_library.json";
import type { BriefingInput } from "./schema";

export type LibraryItem = (typeof library)["items"][number];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function score(question: string, query: string) {
  const qLower = question.toLowerCase();
  const qTokens = new Set(tokenize(question));
  const q2 = tokenize(query);

  let s = 0;
  for (const t of q2) {
    if (qTokens.has(t)) s += 3;
    if (t.length >= 6 && qLower.includes(t)) s += 1;
  }
  return s;
}

function containsLoose(hay: string, needle: string) {
  const h = (hay || "").toLowerCase();
  const n = (needle || "").toLowerCase();
  if (!h || !n) return false;
  return h.includes(n) || n.includes(h);
}

export function retrieveAnchors(brief: BriefingInput, k = 24) {
  const queryText = [
    brief.announcementTopic,
    brief.keyMessages,
    brief.sensitiveIssues,
    brief.mediaOutlet,
    brief.interviewFormat,
    brief.journalistName ?? "",
  ].join("\n");

  let pool = (library.items as LibraryItem[]).filter((x) => x.country === brief.country);

  const ind = brief.industry?.trim();
  if (ind) {
    const filtered = pool.filter((x) => x.industry && containsLoose(x.industry, ind));
    if (filtered.length >= 30) pool = filtered;
  }

  const ranked = pool
    .map((x) => ({ ...x, _score: score(x.question, queryText) }))
    .sort((a, b) => b._score - a._score);

  return ranked.slice(0, k).map(({ _score, ...rest }) => rest);
}
