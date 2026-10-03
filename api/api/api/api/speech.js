import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { text } = req.body || {};

    if (!text) {
      return res.status(400).json({
        error: "No text was provided."
      });
    }

    const response = await client.audio.speech.create({
      model:
        process.env.OPENAI_TTS_MODEL ||
        "gpt-4o-mini-tts",
      voice:
        process.env.OPENAI_TTS_VOICE ||
        "coral",
      input: text,
      format: "mp3"
    });

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    res.setHeader(
      "Content-Type",
      "audio/mpeg"
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(200).send(buffer);

  } catch (error) {
    console.error("Speech generation error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Unable to generate spoken question."
    });
  }
}
