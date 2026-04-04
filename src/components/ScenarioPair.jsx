import { useAppContext } from "../context/AppContext";
import ScenarioBuilder from "./ScenarioBuilder";

export default function ScenarioPair() {
  const { state, dispatch } = useAppContext();

  const cloneScenario = (fromId) => {
    const toId = fromId === "A" ? "B" : "A";
    const source = state.scenarios[fromId];
    dispatch({
      type: "UPDATE_SCENARIO",
      id: toId,
      payload: {
        origin: source.origin,
        stops: [...source.stops],
        departureTime: source.departureTime,
      },
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <ScenarioBuilder id="A" onClone={() => cloneScenario("A")} />
      <ScenarioBuilder id="B" onClone={() => cloneScenario("B")} />
    </div>
  );
}
