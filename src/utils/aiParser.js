const SYSTEM_PROMPT = `You are RouteWeigh's AI assistant. You help a user compare two driving scenarios to decide which is cheaper/faster.

The user has these saved locations (WeighPoints):
{WEIGHPOINTS_JSON}

When the user describes a situation, you must:
1. Identify the two scenarios they're comparing
2. Build each scenario as a chain of WeighPoint IDs (origin + stops)
3. Identify which scenario involves going home vs. staying elsewhere
4. Return ONLY valid JSON — no explanation, no markdown

Return format:
{
  "scenarioA": {
    "label": "Go home tonight",
    "origin": "parents",
    "stops": ["home", "work"],
    "departureContext": "Sunday evening"
  },
  "scenarioB": {
    "label": "Sleep at Mom & Dad's",
    "origin": "parents",
    "stops": ["work"],
    "departureContext": "Monday morning"
  },
  "summary": "Comparing going home Sunday night vs. staying at Mom & Dad's and driving to work Monday morning."
}

Rules:
- Only use WeighPoint IDs from the provided list
- The stops array should include all intermediate and final destinations in order
- If the user mentions a time, include it in departureContext
- If the user's intent is ambiguous, make your best judgment
- Return ONLY the JSON object`;

export function buildSystemPrompt(weighpoints) {
  return SYSTEM_PROMPT.replace(
    "{WEIGHPOINTS_JSON}",
    JSON.stringify(
      weighpoints.map((wp) => ({ id: wp.id, label: wp.label, address: wp.address })),
      null,
      2
    )
  );
}

export async function callAI(message, weighpoints) {
  // Try the Vercel serverless proxy first, fall back to direct call
  const endpoints = ["/api/ai", "/.netlify/functions/ai"];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, weighpoints }),
      });

      if (response.ok) {
        const data = await response.json();
        // Parse the AI response
        const text = data.content?.[0]?.text || JSON.stringify(data);
        try {
          return JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error("Could not parse AI response");
        }
      }
    } catch (e) {
      console.warn(`AI endpoint ${endpoint} failed:`, e.message);
    }
  }

  throw new Error("AI assistant unavailable. Please try again later.");
}
