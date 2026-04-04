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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { message, weighpoints } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const systemPrompt = SYSTEM_PROMPT.replace(
    "{WEIGHPOINTS_JSON}",
    JSON.stringify(
      (weighpoints || []).map((wp) => ({ id: wp.id, label: wp.label, address: wp.address })),
      null,
      2
    )
  );

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: errBody });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
