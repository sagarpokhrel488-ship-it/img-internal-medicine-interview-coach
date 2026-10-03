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
    const {
      question,
      transcript,
      history = [],
      profile = {},
      interviewer = "mayo-pd",
      mode = "standard"
    } = req.body || {};

    if (!transcript) {
      return res.status(400).json({
        error: "No transcript was provided."
      });
    }

    const prompt = `
You are an expert US Internal Medicine residency interview coach
for International Medical Graduates.

You are simulating a fictional AI interviewer. Do NOT claim to be
a real Harvard, Stanford, Mayo Clinic, or other real physician.

Interviewer style: ${interviewer}
Interview mode: ${mode}

Candidate profile:
${JSON.stringify(profile, null, 2)}

Current interview question:
${question}

Candidate's answer:
${transcript}

Previous interview history:
${JSON.stringify(history, null, 2)}

Evaluate the candidate's answer specifically for a US Internal Medicine
residency interview.

Assess:
1. Communication
2. Structure and clarity
3. Specificity and use of examples
4. Professionalism
5. IMG readiness

Identify what was effective and what should be improved.

Then generate ONE natural follow-up interview question based on the
candidate's actual answer. The question should feel like a real
residency interviewer continuing the conversation rather than a
generic question.

Return ONLY valid JSON in this format:

{
  "feedback": "Brief but useful coaching feedback",
  "scores": {
    "communication": 1,
    "structure": 1,
    "specificity": 1,
    "professionalism": 1,
    "imgReadiness": 1
  },
  "nextQuestion": "The next interview question"
}

Each score must be an integer from 1 to 10.
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      input: prompt
    });

    const text =
      response.output_text ||
      "";

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      result = {
        feedback: text,
        scores: {
          communication: 0,
          structure: 0,
          specificity: 0,
          professionalism: 0,
          imgReadiness: 0
        },
        nextQuestion:
          "Thank you. Could you tell me more about that experience?"
      };
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Interview AI error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Unable to generate the AI interview response."
    });
  }
}
