import React, { useState, useEffect } from "react";

// ------------------------------------------------------------
//  Value definitions (extend as needed)
// ------------------------------------------------------------
const VALUE_DEFS = {
  Fame: "Being widely recognized and admired.",
  Authority: "The power to direct or influence others.",
  Loyalty: "Faithful allegiance to people or principles.",
  Determination: "Persistence in pursuing objectives despite obstacles.",
  "Self‑Respect": "Holding oneself in esteem.",
  Popularity: "Being well‑liked by many.",
  Authenticity: "Living in alignment with one's true self and values.",
  Community: "Belonging to and supporting a group of people.",
  Peace: "Absence of conflict and presence of tranquility.",
  "Meaningful Work": "Employment that feels purposeful and significant.",
  Fairness: "Treating people equitably and justly.",
  Honesty: "Being truthful and transparent.",
  Compassion: "Empathy and desire to alleviate suffering.",
  Openness: "Willingness to consider new ideas and experiences.",
  Optimism: "Expectation of positive outcomes.",
  Fun: "Enjoyment and playfulness.",
  Pleasure: "Enjoyable sensory or emotional experience.",
  Justice: "Upholding moral rightness and law.",
  Happiness: "Experiencing contentment and joy.",
  Balance: "Maintaining equilibrium among life's domains.",
  Religion: "Commitment to spiritual beliefs and practices.",
  Challenge: "Welcoming demanding tasks that foster growth.",
  Growth: "Continuous self‑improvement and development.",
  Responsibility: "Accountability for actions and obligations.",
  Security: "Feeling safe and protected.",
  Recognition: "Receiving acknowledgment and praise.",
  Influence: "Ability to shape outcomes and opinions.",
  Trustworthiness: "Being reliable and dependable.",
  Stability: "Consistency and reliability over time.",
  Boldness: "Courage to take risks and act with confidence.",
  Reputation: "General opinion held of one's character.",
  Kindness: "Acting with generosity and consideration.",
  Service: "Helping others through action.",
  Respect: "Regard for the worth of people or things.",
  Status: "Standing or rank in a social hierarchy.",
  Spirituality: "Connection to something transcendent.",
  Friendships: "Valued close relationships with others.",
  Success: "Achieving desired goals.",
  Contribution: "Adding value to the lives of others.",
  Poise: "Composure and grace under pressure.",
  Achievement: "Striving for and attaining goals or excellence.",
  Humor: "Finding and expressing amusement.",
  Creativity: "Generating original ideas and expressions.",
  Citizenship: "Active participation and responsibility in society.",
  Wealth: "Accumulation of financial resources.",
  Leadership: "Guiding and inspiring others.",
  Wisdom: "Deep understanding and sound judgment.",
  Learning: "Gaining new skills and understanding.",
  Autonomy: "Having independence and self‑direction.",
  "Inner Harmony": "A sense of peace and alignment within.",
  Competency: "Possessing ability and skillfulness.",
  Adventure: "Seeking novel and exciting experiences.",
  Faith: "Confident belief in something greater than oneself.",
  Curiosity: "Eager desire to learn and discover.",
  Beauty: "Appreciation for aesthetics and harmony in form.",
  Love: "Deep affection and care.",
  Knowledge: "Understanding through study and experience."
};

const ALL_VALUES = Object.keys(VALUE_DEFS);

export default function ValueRankerApp() {
  // ------------------------------------------------------------
  //  Core ranking state
  // ------------------------------------------------------------
  const [queue, setQueue] = useState(ALL_VALUES);      // yet‑to‑rank names
  const [sorted, setSorted] = useState([]);            // final list in order
  const [candidate, setCandidate] = useState(null);    // item being inserted
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [currentPair, setCurrentPair] = useState(null);// [candidate, compareTo]
  const [lastPair, setLastPair] = useState(null);      // last choice made
  const [history, setHistory] = useState([]);          // undo snapshots

  // ------------------------------------------------------------
  //  NEW: track every decision as “A>B” lines
  // ------------------------------------------------------------
  const [logLines, setLogLines] = useState([]);        // ["Value1>Value2", …]

  // ------------------------------------------------------------
  //  Helpers
  // ------------------------------------------------------------
  const snapshot = () => ({
    queue: [...queue],
    sorted: [...sorted],
    candidate,
    low,
    high,
    lastPair: lastPair ? [...lastPair] : null,
    logLines: [...logLines]
  });

  // ------------------------------------------------------------
  //  Seed a new candidate each time the previous one lands
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
  //  Drive the binary‑search comparisons
  // ------------------------------------------------------------
  useEffect(() => {
    if (candidate === null) {
      setCurrentPair(null);
      return;
    }

    if (sorted.length === 0) {
      insertCandidate(0);
      return;
    }

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
    setCandidate(null);
  };

  const choose = (picked) => {
    if (!currentPair) return;

    setHistory((h) => [...h, snapshot()]);

    const [cand, comp] = currentPair;
    const loser = picked === cand ? comp : cand;
    setLastPair([cand, comp, picked]);
    setLogLines((logs) => [...logs, `${picked}>${loser}`]);

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
      setQueue(prev.queue);
      setSorted(prev.sorted);
      setCandidate(prev.candidate);
      setLow(prev.low);
      setHigh(prev.high);
      setLastPair(prev.lastPair);
      setLogLines(prev.logLines);
      return h.slice(0, -1);
    });
  };

  // ------------------------------------------------------------
  //  IMPORT: paste “A>B” lines to rebuild state
  // ------------------------------------------------------------
  const [importText, setImportText] = useState("");
  const handleImport = () => {
    const lines = importText
      .split(/\n|\r/)
      .map((l) => l.trim())
      .filter(Boolean);
    // Reset state
    const newSorted = [];
    const seen = new Set();
    lines.forEach((l) => {
      const [winner, loser] = l.split(">").map((s) => s.trim());
      if (!winner || !loser) return;
      // simple insertion: winner before loser
      if (!seen.has(winner)) {
        newSorted.push(winner);
        seen.add(winner);
      }
      if (!seen.has(loser)) {
        newSorted.push(loser);
        seen.add(loser);
      }
      // If order wrong, reorder (naïve)
      const wIdx = newSorted.indexOf(winner);
      const lIdx = newSorted.indexOf(loser);
      if (wIdx > lIdx) {
        newSorted.splice(wIdx, 1);
        newSorted.splice(lIdx, 0, winner);
      }
    });
    const remaining = ALL_VALUES.filter((v) => !seen.has(v));
    setSorted(newSorted);
    setQueue(remaining);
    setCandidate(null);
    setLow(0);
    setHigh(newSorted.length);
    setCurrentPair(null);
    setLastPair(null);
    setHistory([]);
    setLogLines(lines);
  };

  // ------------------------------------------------------------
  //  UI helpers
  // ------------------------------------------------------------
  const Card = ({ name, highlight, onClick }) => (
    <div
      onClick={onClick}
      className={`w-full max-w-xs p-4 rounded-2xl shadow-md border border-gray-200 cursor-pointer bg-white transition hover:shadow-lg ${
        highlight ? "bg-blue-300" : ""
      }`}
    >
      <h2 className="text-lg font-semibold text-center text-gray-800">
        {name}
      </h2>
      <p className="mt-2 text-sm text-gray-700 text-center whitespace-pre-wrap">
        {VALUE_DEFS[name] || "—"}
      </p>
    </div>
  );

  // ------------------------------------------------------------
  //  Render
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col items-center p-6 gap-10 w-full">
      <div className="flex flex-col items-center gap-2">
        <img src="/favicon.png" alt="Value Ranker logo" className="w-[150px] h-[150px]" />
        <h1 className="text-4xl font-bold">Value Ranker, 2!</h1>
      </div>

      {/* Import area (always visible for simplicity) */}
      <div className="w-full max-w-xl flex flex-col gap-2">
        <textarea
          placeholder="Paste past selections to start where you left off (e.g., Achievement>Adventure) one per line"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-24 p-2 border rounded"
        />
        <button
          onClick={handleImport}
          className="self-end bg-gray-800 text-white px-3 py-1 rounded"
        >
          Load comparisons
        </button>
      </div>

      {/* Comparison pair */}
      {currentPair ? (
        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
          <div className="flex gap-8 flex-wrap justify-center w-full">
            <Card name={currentPair[0]} onClick={() => choose(currentPair[0])} />
            <Card name={currentPair[1]} onClick={() => choose(currentPair[1])} />
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

      {/* Last choice stacked */}
      {lastPair && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Card name={lastPair[2]} highlight />
          <Card name={lastPair[2] === lastPair[0] ? lastPair[1] : lastPair[0]} />
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

      {/* Export log */}
      <div className="w-full max-w-xl">
        <h3 className="text-md font-medium mb-1">Your selections (copy to save):</h3>
        <textarea
          readOnly
          value={logLines.join("\n")}
          className="w-full h-32 p-2 border rounded bg-gray-50"
        />
      </div>
    </div>
  );
}
