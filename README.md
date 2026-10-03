# IMG Residency Interview Coach — AI version

This is a full-stack prototype for AI-powered Internal Medicine residency interview practice.

## Features
- Six clearly labeled fictional interviewer styles inspired by program types (not real Harvard/Stanford/Mayo physicians).
- Standard, Challenging, and Stress modes.
- 8/12/16-question interviews.
- iPad microphone recording using MediaRecorder.
- Server-side speech-to-text with OpenAI transcription.
- Adaptive AI follow-up questions based on the candidate's actual answer.
- AI coaching after every answer.
- Final report with communication, structure, specificity, professionalism, and IMG-readiness scores.
- Question-by-question feedback.
- Optional candidate profile.

## Deployment
GitHub Pages can host only the static frontend. The AI endpoints need a server runtime. The easiest deployment is Vercel connected to this GitHub repository.

1. Push these files to GitHub.
2. Import the repository into Vercel.
3. Add environment variable `OPENAI_API_KEY`.
4. Optional variables:
   - `OPENAI_MODEL` (default `gpt-6-luna`)
   - `OPENAI_TRANSCRIBE_MODEL` (default `gpt-transcribe`)
   - `OPENAI_TTS_MODEL` (default `gpt-4o-mini-tts`)
   - `OPENAI_TTS_VOICE` (default `coral`)
5. Deploy.
6. Open the Vercel HTTPS URL in iPad Safari and allow microphone access.

Never put `OPENAI_API_KEY` in `index.html` or any browser-side JavaScript.
