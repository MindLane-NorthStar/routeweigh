import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { callAI } from "../utils/aiParser";

export default function AiAssistant() {
  const { state, dispatch } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const result = await callAI(input.trim(), state.weighpoints);

      // Populate Scenario A
      if (result.scenarioA) {
        dispatch({
          type: "UPDATE_SCENARIO",
          id: "A",
          payload: {
            origin: result.scenarioA.origin || "",
            stops: result.scenarioA.stops || [],
            departureTime: "",
          },
        });
      }

      // Populate Scenario B
      if (result.scenarioB) {
        dispatch({
          type: "UPDATE_SCENARIO",
          id: "B",
          payload: {
            origin: result.scenarioB.origin || "",
            stops: result.scenarioB.stops || [],
            departureTime: "",
          },
        });
      }

      setSummary(result.summary || "Scenarios populated. Hit WEIGH ROUTES to compare.");
      setInput("");
    } catch (err) {
      setError(err.message || "AI assistant failed");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl text-sm text-amber-700 hover:border-amber-300 transition-colors text-left"
      >
        ✨ <span className="font-medium">Describe your situation</span>
        <span className="text-amber-400 ml-1">— AI will build both scenarios for you</span>
      </button>
    );
  }

  return (
    <div className="mb-4 bg-white rounded-2xl shadow-card border border-amber-200 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-700">✨ AI Scenario Builder</span>
        <button
          onClick={() => setExpanded(false)}
          className="text-amber-400 hover:text-amber-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I'm at Mom and Dad's on Sunday evening. I need to be at work Monday at 7am. Should I go home tonight or sleep here?"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                Thinking...
              </span>
            ) : (
              "Build Scenarios"
            )}
          </button>

          {summary && (
            <p className="text-sm text-green-600 flex-1">{summary}</p>
          )}
          {error && (
            <p className="text-sm text-red-500 flex-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
