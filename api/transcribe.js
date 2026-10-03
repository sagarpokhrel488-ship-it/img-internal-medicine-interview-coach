import OpenAI, { toFile } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audioBase64, mimeType } = req.body || {};

    if (!audioBase64) {
      return res.status(400).json({
        error: "No audio was provided."
      });
    }

    const buffer = Buffer.from(audioBase64, "base64");

    const extension =
      mimeType && mimeType.includes("mp4") ? "mp4" : "webm";

    const audioFile = await toFile(
      buffer,
      `answer.${extension}`,
      {
        type: mimeType || "audio/webm"
      }
    );

    const transcription =
      await client.audio.transcriptions.create({
        file: audioFile,
        model:
          process.env.OPENAI_TRANSCRIBE_MODEL ||
          "gpt-transcribe"
      });

    return res.status(200).json({
      transcript: transcription.text || ""
    });

  } catch (error) {
    console.error("Transcription error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Unable to transcribe the recording."
    });
  }
}
