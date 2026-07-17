import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()
const MODEL = 'claude-haiku-4-5-20251001'

export interface SuggestionContext {
  season: string
  child1Age: string
  child2Age: string
  recentThemes: string[]
}

export async function generateQuestionSuggestions(ctx: SuggestionContext): Promise<string[]> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Generate 2 warm, brief journaling questions for a parent writing weekly memory letters to their kids (ages ${ctx.child1Age} and ${ctx.child2Age}).

Season: ${ctx.season}
Themes covered recently (avoid these): ${ctx.recentThemes.join(', ') || 'none'}

Requirements:
- Answerable in 2-4 sentences
- Specific to young children at these ages
- From one of these themes (pick underrepresented ones): milestone, funny, feelings, routines, gratitude

Return exactly 2 questions, one per line, no numbering, no bullets, no extra text.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return text.split('\n').map(q => q.trim()).filter(q => q.length > 0).slice(0, 2)
}

export interface ComposeContext {
  weekOf: string
  child1Name: string
  child2Name: string
  answers: Array<{ question: string; answer: string }>
}

export async function composeEmail(ctx: ComposeContext): Promise<string> {
  const answersText = ctx.answers
    .map(a => `Question: ${a.question}\nAnswer: ${a.answer}`)
    .join('\n\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are helping a parent write a brief weekly memory letter to their children (${ctx.child1Name} and ${ctx.child2Name}).

Week of: ${ctx.weekOf}

Parent's answers:

${answersText}

Write a structured letter with these exact HTML sections:

<section>
<h2>📅 This week</h2>
<p>[2-4 sentences from the parent's "what happened this week" answer]</p>
</section>

<section>
<h2>💛 What I love about you both right now</h2>
<p>[2-3 sentences from the "what I love" answer, specific and tender]</p>
</section>

[Additional answers as <section><h2>[short heading]</h2><p>[answer]</p></section>]

Rules:
- Keep the parent's exact words as much as possible — lightly weave, do not rewrite or expand
- Warm but not saccharine
- Brief — this is a weekly snapshot
- Return only the HTML sections above, no greeting, no sign-off, no subject line`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}
