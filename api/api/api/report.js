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
      history = [],
      profile = {},
      interviewer = "mayo-pd",
      mode = "standard"
    } = req.body || {};

    const prompt = `
You are an expert coach for US Internal Medicine residency
interviews for International Medical Graduates.

Create a detailed but practical final interview report.

This is a fictional AI simulation. Do not claim to be a real
Harvard, Stanford, Mayo Clinic, or other real physician.

Interviewer style: ${interviewer}
Interview mode: ${mode}

Candidate profile:
${JSON.stringify(profile, null, 2)}

Complete interview history:
${JSON.stringify(history, null, 2)}

Evaluate the candidate across:
- Communication
- Structure and clarity
- Specificity
- Professionalism
- IMG readiness

Provide:
1. Overall score
2. Individual category scores
3. Concise overall assessment
4. Specific strengths demonstrated
5. Highest-priority improvements
6. Question-by-question feedback

Do not predict whether the candidate will match into residency.
Do not recommend or rank residency programs.

Return ONLY valid JSON:

{
  "overall": 1,
  "communication": 1,
  "structure": 1,
  "specificity": 1,
  "professionalism": 1,
  "imgReadiness": 1,
  "summary": "Overall assessment",
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "improvements": [
    "Priority improvement 1",
    "Priority improvement 2",
    "Priority improvement 3"
  ],
  "history": [
    {
      "question": "Interview question",
      "answer": "Candidate answer",
      "feedback": "Specific feedback"
    }
  ]
}

All scores must be integers from 1 to 10.
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      input: prompt
    });

    const text = response.output_text || "";

    let report;

    try {
      report = JSON.parse(text);
    } catch {
      report = {
        overall: 0,
        communication: 0,
        structure: 0,
        specificity: 0,
        professionalism: 0,
        imgReadiness: 0,
        summary: text,
        strengths: [],
        improvements: [],
        history
      };
    }

    return res.status(200).json(report);

  } catch (error) {
    console.error("Report error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Unable to generate the final interview report."
    });
  }
}
