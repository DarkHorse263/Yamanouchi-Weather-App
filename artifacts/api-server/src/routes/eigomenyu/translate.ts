import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { requireOwner } from "./middleware";

const router: IRouter = Router();

const TRANSLATION_SYSTEM_PROMPT = `You are a Japanese-to-English menu translator for rural Japanese restaurants. Your job is to help foreign tourists understand menu items.

RULES:
- Preserve authentic Japanese dish names (e.g., "Tonkatsu" not "Fried Pork Cutlet")
- Use the Japanese name as the English title when it's a well-known dish
- Write short, factual descriptions (one sentence, no marketing language)
- Include romaji transliteration of the Japanese name
- Include a phonetic English pronunciation guide
- Rate your confidence from 0.0 to 1.0
- Add warnings if the name is ambiguous, regional, or you're unsure

Respond ONLY with valid JSON in this exact format:
{
  "title_en": "English title for the dish",
  "description_en": "Brief factual description of what this dish is",
  "name_romaji": "Romaji transliteration",
  "name_phonetic_en": "Phonetic pronunciation guide for English speakers",
  "confidence": 0.95,
  "warnings": []
}`;

router.post("/translate", requireOwner, async (req, res): Promise<void> => {
  const { nameJa, hint } = req.body;

  if (!nameJa) {
    res.status(400).json({ error: "nameJa is required" });
    return;
  }

  let userMessage = `Translate this Japanese menu item: ${nameJa}`;
  if (hint) {
    userMessage += `\nHint from the restaurant owner: ${hint}`;
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: userMessage }],
      system: TRANSLATION_SYSTEM_PROMPT,
    });

    const block = message.content[0];
    if (block.type !== "text") {
      res.status(500).json({ error: "Unexpected response from AI" });
      return;
    }

    let rawText = block.text.trim();
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      rawText = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(rawText);

    res.json({
      title_en: parsed.title_en,
      description_en: parsed.description_en,
      name_romaji: parsed.name_romaji,
      name_phonetic_en: parsed.name_phonetic_en,
      confidence: parsed.confidence,
      warnings: parsed.warnings || [],
    });
  } catch (err: unknown) {
    console.error("Translation error:", err);
    const message = err instanceof Error ? err.message : "Translation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
