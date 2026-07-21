// Uses Groq's free, OpenAI-compatible chat completions API.
// Get a free key (no credit card) at https://console.groq.com
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set — AI interview features require it.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Groq API request timed out after 25 seconds — check your network connection or Groq status.');
    }
    throw new Error(`Groq API request failed: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Generates 4 interview questions tailored to a job's title/description/skills.
async function generateQuestions(job) {
  const prompt = `You are a technical interviewer conducting a SPOKEN, verbal interview — the candidate will answer out loud, with no whiteboard, no code editor, and no way to draw diagrams.

Generate exactly 4 interview questions for a candidate applying to this role:

Title: ${job.title}
Category: ${job.category}
Skills: ${(job.skills || []).join(', ')}
Description: ${job.description}

Rules for the questions:
- Every question must be fully answerable in 30-90 seconds of spoken explanation — no diagrams, no writing code, no step-by-step architecture design.
- Favor questions like: "Tell me about a time you...", "How would you explain X to a junior engineer?", "What's the tradeoff between A and B?", "Walk me through your reasoning when you encountered Y."
- Avoid words like "design", "draw", "diagram", "write code for", "architect a system" — these require visual/written output the candidate cannot produce verbally.
- Questions should still be specific to this role's skills and level, not generic.

Respond with ONLY a JSON array of 4 question strings, nothing else. Example format:
["question 1", "question 2", "question 3", "question 4"]`;

  const text = await callGroq(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();
  const questions = JSON.parse(cleaned);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI did not return valid questions');
  }
  return questions;
}

// Scores a completed Q&A transcript against the job, returns { score, feedback, perQuestion }.
async function scoreInterview(job, qaPairs) {
  const transcript = qaPairs
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  const prompt = `You are evaluating a candidate's spoken interview answers for this role:

Title: ${job.title}
Description: ${job.description}

Transcript:
${transcript}

Score EACH answer individually from 1-10, with a short 1-sentence note per answer, THEN give an overall score and summary.

Respond with ONLY valid JSON in this exact format, nothing else:
{
  "perQuestion": [
    {"score": <1-10>, "note": "<one sentence>"},
    {"score": <1-10>, "note": "<one sentence>"},
    {"score": <1-10>, "note": "<one sentence>"},
    {"score": <1-10>, "note": "<one sentence>"}
  ],
  "overallScore": <1-10>,
  "overallFeedback": "<2-3 sentence summary of strengths and gaps across all answers>"
}`;

  const text = await callGroq(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();
  const result = JSON.parse(cleaned);

  if (typeof result.overallScore !== 'number' || !result.overallFeedback || !Array.isArray(result.perQuestion)) {
    throw new Error('AI did not return a valid score/feedback breakdown');
  }

  const clamp = (n) => Math.max(1, Math.min(10, Math.round(n)));
  return {
    score: clamp(result.overallScore),
    feedback: result.overallFeedback,
    perQuestion: result.perQuestion.map((pq) => ({
      score: clamp(pq.score),
      feedback: pq.note || '',
    })),
  };
}

module.exports = { generateQuestions, scoreInterview };