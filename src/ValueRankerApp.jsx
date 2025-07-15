import React, { useState, useEffect } from "react";

// ------------------------------------------------------------
//  Definitions for each value
// ------------------------------------------------------------
const VALUE_DEFS = {
  Authenticity: "Living in alignment with one's true self and values.",
  Achievement: "Striving for and attaining goals or excellence.",
  Adventure: "Seeking novel and exciting experiences.",
  Authority: "The power to direct or influence others.",
  Autonomy: "Having independence and self‑direction."
  // … add the rest when you’re ready
};

export default function ValueRankerApp() {
  // ------------------------------------------------------------
  //  Data setup – work with value *names* only, avoids object‑identity bugs
  // ------------------------------------------------------------
  const allValues = Object.keys(VALUE_DEFS);

  // ------------------------------------------------------------
  //  State
  // ------------------------------------------------------------
  const [queue, setQueue] = useState(allValues);     // names waiting to be ranked
  const [sorted, setSorted] = useState([]);          // fully ranked names
  const [candidate, setCandidate] = useState(null);  // name currently inserting
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [currentPair, setCurrentPair] = useState(null); // [candidate, comparison]
  const [lastPair, setLastPair] = useState(null);       // [cand, comp, winner]
  const [history, setHistory] = useState([]);           // snapshots for undo

  // ------------------------------------------------------------
  //  Helpers
  // ------------------------------------------------------------
  const snapshot = () => ({
    queue: [...queue],          // clone to avoid later mutation surprises
    sorted: [...sorted],
    candidate,
    low,
    high,
    lastPair: lastPair ? [...lastPair] : null,
  });

  // ------------------------------------------------------------
  //  Seed next candidate whenever we’re ready
  // ------------------------------------------------------------
  useEffect(() => {
    if (candidate === null && queue.length) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setCandidate(next);
      setLow(0);
      setHigh(sorted.length);
    }
  }, [candidate, queue, sorted.length]);

  // ------------------------------------------------------------
  //  Binary‑search comparisons
  // ------------------------------------------------------------
  useEffect(() => {
    if (candidate === null) {
      setCurrentPair(null);
      return;
    }

    // Empty sorted list – insert directly
    if (sorted.length === 0) {
      insertCandidate(0);
      return;
    }

    // Search finished → insert
    if (low >= high) {
      insertCandidate(low);
      return;
    }

    const mid = Math.floor((low + high) / 2);
    setCurrentPair([candidate, sorted[mid]]);
  }, [candidate, low, high, sorted]);

  // ------------------------------------------------------------
  //  Core actions
  // ------------------------------------------------------------
  const insertCandidate = (index) => {
    setSorted((s) => {
      const copy = [...s];
      copy.splice(index, 0, candidate);
      return copy;
    });
    // DO NOT push a history snapshot here; insertion is a continuation
    // of the prior comparison that is already snapshotted in choose() below.
    setCandidate(null);
  };

  const choose = (picked) => {
    if (!currentPair) return;

    // Save state BEFORE mutating anything so undo reverses this choice.
    setHistory((h) => [...h, snapshot()]);

    const [cand, comp] = currentPair;
    setLastPair([cand, comp, picked]);

    if (picked === cand) {
      setHigh(Math.floor((low + high) / 2));
    } else {
      setLow(Math.floor((low + high) / 2) + 1);
    }
  };

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      // Restore snapshot
      setQueue(prev.queue);
      setSorted(prev.sorted);
      setCandidate(prev.candidate);
      setLow(prev.low);
      setHigh(prev.high);
      setLastPair(prev.lastPair);
      return h.slice(0, -1);
    });
  };

  // ------------------------------------------------------------
  //  UI components
  // ------------------------------------------------------------
  const Card = ({ valueName, onClick, highlight }) => (
    <div
      onClick={onClick}
      className={`w-full max-w-xs p-4 rounded-2xl shadow-md border border-gray-200 cursor-pointer bg-white transition hover:shadow-lg ${
        highlight ? "bg-blue-300" : ""
      }`}
    >
      <h2 className="text-lg font-semibold text-center text-gray-800">
        {valueName}
      </h2>
      <p className="mt-2 text-sm text-gray-700 text-center whitespace-pre-wrap">
        {VALUE_DEFS[valueName]}
      </p>
    </div>
  );

  // ------------------------------------------------------------
  //  Render
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col items-center p-6 gap-10">
      <h1 className="text-4xl font-bold">Value Ranker</h1>

      {/* Pair to choose */}
      {currentPair ? (
        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
          <div className="flex gap-8 flex-wrap justify-center w-full">
            <Card
              valueName={currentPair[0]}
              onClick={() => choose(currentPair[0])}
            />
            <Card
              valueName={currentPair[1]}
              onClick={() => choose(currentPair[1])}
            />
          </div>
          <button onClick={undo} className="text-sm font-medium underline">
            Undo last
          </button>
        </div>
      ) : (
        <p className="text-lg">
          {queue.length === 0 ? "All done!" : "Preparing next pair…"}
        </p>
      )}

      {/* Last pick, stacked */}
      {lastPair && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Card valueName={lastPair[2]} highlight />
          <Card
            valueName={
              lastPair[2] === lastPair[0] ? lastPair[1] : lastPair[0]
            }
          />
        </div>
      )}

      {/* Running list */}
      <div className="w-full max-w-md">
        <h3 className="text-md font-medium mb-2">
          Ranked so far ({sorted.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {sorted.map((name, idx) => (
            <span key={name} className="text-xs bg-gray-200 rounded px-2 py-1">
              {idx + 1}. {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}