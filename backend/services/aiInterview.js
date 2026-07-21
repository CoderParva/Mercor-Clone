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

// Generates a targeted follow-up question probing the depth/consistency of a specific answer.
async function generateFollowUp(job, originalQuestion, answer) {
  const prompt = `You are a spoken-interview interviewer for this role:

Title: ${job.title}
Description: ${job.description}

You just asked: "${originalQuestion}"
The candidate answered: "${answer}"

Generate ONE natural follow-up question that:
- Probes deeper into a specific detail they mentioned, OR
- Checks whether their answer is genuine/consistent (e.g. asks for a specific number, name, or detail that would be hard to fabricate on the spot), OR
- Asks them to clarify something vague or generic in their answer.
- Must be answerable in 20-60 seconds of spoken explanation — no diagrams or code.
- If their answer was extremely thin (e.g. "I don't know" or one word), ask them to elaborate on the core topic instead.

Respond with ONLY the follow-up question text, nothing else — no quotes, no JSON, no preamble.`;

  const text = await callGroq(prompt);
  return text.trim().replace(/^["']|["']$/g, '');
}

// Scores a completed Q&A transcript (including follow-ups) against the job.
async function scoreInterview(job, qaPairs) {
  const transcript = qaPairs
    .map((qa, i) => {
      let block = `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`;
      if (qa.followUpQuestion) {
        block += `\nFollow-up: ${qa.followUpQuestion}\nFollow-up Answer: ${qa.followUpAnswer || '(no answer given)'}`;
      }
      return block;
    })
    .join('\n\n');

  const prompt = `You are evaluating a candidate's spoken interview answers for this role, including follow-up questions used to probe depth and check consistency:

Title: ${job.title}
Description: ${job.description}

Transcript:
${transcript}

For each main question, consider BOTH the initial answer and the follow-up exchange together. If the follow-up answer contradicts, is vague, or fails to substantiate the original answer, reflect that with a lower score and mention it in the note. If the follow-up answer confirms and deepens the original answer, score higher.

Score EACH main question (with its follow-up) from 1-10, with a short 1-sentence note, THEN give an overall score and summary.

Respond with ONLY valid JSON in this exact format, nothing else:
{
  "perQuestion": [
    {"score": <1-10>, "note": "<one sentence, mention if follow-up confirmed or contradicted the original answer>"},
    {"score": <1-10>, "note": "<one sentence>"},
    {"score": <1-10>, "note": "<one sentence>"},
    {"score": <1-10>, "note": "<one sentence>"}
  ],
  "overallScore": <1-10>,
  "overallFeedback": "<2-3 sentence summary of strengths, gaps, and any consistency concerns found via follow-ups>"
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

module.exports = { generateQuestions, generateFollowUp, scoreInterview };