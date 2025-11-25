"use client";

import { fetchHistory, saveHistoryEntry } from "@/manage/history";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Operation = "addition" | "subtraction" | "multiplication" | "division" | "square";

type DifficultyId = "sparks" | "balanced" | "insane";

type Problem = {
  prompt: string;
  answer: number;
  operation: Operation;
};

type HistoryEntry = {
  id: number;
  duration: number;
  timeTaken: number;
  difficulty: DifficultyId;
  operations: string[];
  correct: number;
  attempted: number;
  score: number;
  accuracy: number;
  pace: number;
  problemAttempts: Array<{
    prompt: string;
    answer: number;
    userAnswer: number;
    operation: string;
    isCorrect: boolean;
    timeTaken: number;
  }>;
  createdAt: string;
};

const operationOptions: { id: Operation; label: string; symbol: string }[] = [
  { id: "addition", label: "Addition", symbol: "+" },
  { id: "subtraction", label: "Subtraction", symbol: "−" },
  { id: "multiplication", label: "Multiplication", symbol: "×" },
  { id: "division", label: "Division", symbol: "÷" },
  { id:'square', label: 'Square', symbol: '²'},
];

const difficulties: {
  id: DifficultyId;
  label: string;
  min: number;
  max: number;
  description: string;
}[] = [
  {
    id: "sparks",
    label: "Sparks",
    min: 0,
    max: 9,
    description: "Single digits. Pure speed.",
  },
  {
    id: "balanced",
    label: "Balanced",
    min: 3,
    max: 24,
    description: "Like classic Zetamac rounds.",
  },
  {
    id: "insane",
    label: "Insane",
    min: 10,
    max: 99,
    description: "Two-digit chaos, zero mercy.",
  },
];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

type Expression = {
  value: number;
  string: string;
};

function generateExpression(
  numOps: number,
  difficulty: (typeof difficulties)[number],
): Expression {
  if (numOps === 0) {
    const num = randomInt(difficulty.min, difficulty.max);
    return { value: num, string: num.toString() };
  }

  const ops: Operation[] = ["addition", "subtraction", "multiplication"];
  const operation = ops[Math.floor(Math.random() * ops.length)];
  const leftOps = Math.floor(Math.random() * numOps);
  const rightOps = numOps - 1 - leftOps;

  const left = generateExpression(leftOps, difficulty);
  const right = generateExpression(rightOps, difficulty);

  switch (operation) {
    case "addition": {
      return {
        value: left.value + right.value,
        string: `(${left.string} + ${right.string})`,
      };
    }
    case "subtraction": {
      let leftExpr = left;
      let rightExpr = right;
      if (left.value < right.value) {
        [leftExpr, rightExpr] = [right, left];
      }
      return {
        value: leftExpr.value - rightExpr.value,
        string: `(${leftExpr.string} − ${rightExpr.string})`,
      };
    }
    case "multiplication": {
      return {
        value: left.value * right.value,
        string: `(${left.string} × ${right.string})`,
      };
    }
    default:
      return { value: 0, string: "0" };
  }
}

function generateProblem(ops: Operation[], difficulty: (typeof difficulties)[number]): Problem {
  const operation = ops[Math.floor(Math.random() * ops.length)];
  const a = randomInt(difficulty.min, difficulty.max);
  const b = randomInt(difficulty.min, difficulty.max);

  switch (operation) {
    case "addition": {
      return {
        prompt: `${a} + ${b}`,
        answer: a + b,
        operation,
      };
    }
    case "subtraction": {
      const minuend = Math.max(a, b);
      const subtrahend = Math.min(a, b);
      return {
        prompt: `${minuend} − ${subtrahend}`,
        answer: minuend - subtrahend,
        operation,
      };
    }
    case "multiplication": {
      return {
        prompt: `${a} × ${b}`,
        answer: a * b,
        operation,
      };
    }
    case "division": {
      const divisor = Math.max(1, b);
      const quotient = Math.max(1, a);
      const dividend = divisor * quotient;
      return {
        prompt: `${dividend} ÷ ${divisor}`,
        answer: quotient,
        operation,
      };
    }
    case "square": {
      const base = a;
      return {
        prompt: `${base}²`,
        answer: base * base,
        operation,
      };
    }
    default:
      return { prompt: "0 + 0", answer: 0, operation: "addition" };
  }
}

function generateWorkingMemoryProblem(
  numOps: number,
  difficulty: (typeof difficulties)[number],
): Problem {
  const expression = generateExpression(numOps, difficulty);
  expression.string = expression.string.slice(1, -1);
  return {
    prompt: expression.string,
    answer: expression.value,
    operation: "addition",
  };
}

export default function MathTrainer() {
  const [durationMinutes, setDurationMinutes] = useState(2);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [duration, setDuration] = useState(120);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [difficulty, setDifficulty] = useState<DifficultyId>("balanced");
  const [activeOps, setActiveOps] = useState<Operation[]>(
    operationOptions.map((op) => op.id),
  );
  const [problem, setProblem] = useState<Problem>(() =>
    generateProblem(activeOps, difficulties[1]),
  );
  const [status, setStatus] = useState<"idle" | "running" | "finished">("idle");
  const [attempted, setAttempted] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [problemAttempts, setProblemAttempts] = useState<Array<{
    prompt: string;
    answer: number;
    userAnswer: number;
    operation: Operation;
    isCorrect: boolean;
    timeTaken: number;
  }>>([]);
  const [activeTab, setActiveTab] = useState<"operations" | "working-memory">("operations");
  const [workingMemoryOps, setWorkingMemoryOps] = useState(2);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mathTrainer_autoSubmit");
      return saved === "true";
    }
    return false;
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFinishedRef = useRef(false);
  const problemStartTimeRef = useRef<number | null>(null);
  const currentDifficulty = useMemo(
    () => difficulties.find((d) => d.id === difficulty) ?? difficulties[1],
    [difficulty],
  );

  useEffect(() => {
    if (status === "running") {
      inputRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    if (status === "idle") {
      setProblem(
        activeTab === "working-memory"
          ? generateWorkingMemoryProblem(workingMemoryOps, currentDifficulty)
          : generateProblem(activeOps, currentDifficulty),
      );
    }
  }, [activeTab, workingMemoryOps, currentDifficulty, activeOps, status]);

  useEffect(() => {
    if (status === "running" && problem) {
      problemStartTimeRef.current = Date.now();
    }
  }, [status, problem]);

  const selectedEntry = useMemo(
    () => history.find((entry) => entry.id === selectedEntryId) ?? null,
    [history, selectedEntryId],
  );

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchHistory();
        setHistory(data);
        setSelectedEntryId((prev) => prev ?? data[0]?.id ?? null);
      } catch (error) {
        // User might not be logged in, silently fail
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mathTrainer_autoSubmit", String(autoSubmit));
    }
  }, [autoSubmit]);

  const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
  const incorrect = attempted - correct;
  const score = Math.max(0, correct * 4 - incorrect);
  const pace =
    duration === timeLeft
      ? 0
      : Math.round((correct / (duration - timeLeft)) * 60 * 10) / 10;

  const finishRound = useCallback(async () => {
    if (status === "finished" || hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setStatus("finished");
    const timeTaken = duration - timeLeft;
    const finalPace = duration === 0 ? 0 : correct / (duration / 60);
    const tempId = Date.now();
    const newEntry = {
      duration,
      timeTaken,
      difficulty,
      operations: activeOps,
      correct,
      attempted,
      score,
      accuracy,
      pace: finalPace,
      problemAttempts,
      createdAt: new Date().toISOString(),
    };

    setHistory((prev) => [
      {
        id: tempId,
        ...newEntry,
        problemAttempts: problemAttempts.map((attempt) => ({
          prompt: attempt.prompt,
          answer: attempt.answer,
          userAnswer: attempt.userAnswer,
          operation: attempt.operation,
          isCorrect: attempt.isCorrect,
          timeTaken: attempt.timeTaken,
        })),
      },
      ...prev,
    ]);
    setSelectedEntryId(tempId);

    try {
      const savedEntry = await saveHistoryEntry(newEntry);
      if (savedEntry) {
        setHistory((prev) =>
          prev.map((entry) =>
            entry.id === tempId ? savedEntry : entry,
          ),
        );
        setSelectedEntryId(savedEntry.id);
      }
    } catch (error) {
      // User might not be logged in, silently fail
    }
  }, [accuracy, attempted, correct, duration, score, status, timeLeft, activeOps, problemAttempts]);

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === "running" && timeLeft === 0) {
      finishRound();
    }
  }, [timeLeft, status, finishRound]);

  const startRound = () => {
    hasFinishedRef.current = false;
    setAttempted(0);
    setCorrect(0);
    setValue("");
    setFeedback(null);
    setProblemAttempts([]);
    setTimeLeft(duration);
    const newProblem = activeTab === "working-memory"
      ? generateWorkingMemoryProblem(workingMemoryOps, currentDifficulty)
      : generateProblem(activeOps, currentDifficulty);
    setProblem(newProblem);
    setStatus("running");
    problemStartTimeRef.current = Date.now();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && status !== "running") {
        event.preventDefault();
        startRound();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, startRound]);

  const cancelRound = () => {
    hasFinishedRef.current = false;
    setAttempted(0);
    setCorrect(0);
    setValue("");
    setFeedback(null);
    setProblemAttempts([]);
    setTimeLeft(duration);
    setStatus("idle");
  };

  const submitAnswer = (answer: number) => {
    const isCorrect = answer === problem.answer;
    setAttempted((prev) => prev + 1);
    if (isCorrect) {
      setCorrect((prev) => prev + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    const timeTaken = problemStartTimeRef.current 
      ? Math.round((Date.now() - problemStartTimeRef.current) / 1000)
      : 0;

    setProblemAttempts((prev) => [
      ...prev,
      {
        prompt: problem.prompt,
        answer: problem.answer,
        userAnswer: answer,
        operation: problem.operation,
        isCorrect,
        timeTaken,
      },
    ]);

    setProblem(
      activeTab === "working-memory"
        ? generateWorkingMemoryProblem(workingMemoryOps, currentDifficulty)
        : generateProblem(activeOps, currentDifficulty),
    );
    setValue("");
    inputRef.current?.focus();
    problemStartTimeRef.current = Date.now();

    setTimeout(() => setFeedback(null), 500);
  };

  const checkAutoSubmit = useCallback((newValue: string) => {
    if (
      autoSubmit &&
      status === "running" &&
      newValue.trim() !== "" &&
      !Number.isNaN(Number(newValue))
    ) {
      const parsed = Number(newValue);
      if (parsed === problem.answer) {
        submitAnswer(parsed);
      }
    }
  }, [autoSubmit, status, problem, submitAnswer]);

  useEffect(() => {
    if (status !== "running") return;

    const keyMap: Record<string, string> = {
      i: "7",
      o: "8",
      p: "9",
      j: "0",
      k: "4",
      l: "5",
      ";": "6",
      m: "1",
      ",": "2",
      ".": "3",
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" && target !== inputRef.current) {
        return;
      }

      const mappedKey = keyMap[event.key.toLowerCase()];
      if (mappedKey) {
        event.preventDefault();
        event.stopPropagation();
        const newValue = value + mappedKey;
        setValue(newValue);
        checkAutoSubmit(newValue);
        return;
      }

      if (event.key === "Backspace" && target !== inputRef.current) {
        event.preventDefault();
        event.stopPropagation();
        setValue((prev) => prev.slice(0, -1));
        return;
      }

      if (event.key === "Enter" && target !== inputRef.current) {
        event.preventDefault();
        event.stopPropagation();
        if (value.trim()) {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            submitAnswer(parsed);
          }
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, value, submitAnswer, checkAutoSubmit]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    submitAnswer(parsed);
  };

  const updateDuration = (minutes: number, seconds: number) => {
    const totalSeconds = minutes * 60 + seconds;
    setDuration(totalSeconds);
    if (status !== "running") {
      setTimeLeft(totalSeconds);
    }
  };

  const handleMinutesChange = (value: string) => {
    const minutes = Math.max(0, Math.floor(Number(value) || 0));
    setDurationMinutes(minutes);
    updateDuration(minutes, durationSeconds);
  };

  const handleSecondsChange = (value: string) => {
    const seconds = Math.max(0, Math.min(59, Math.floor(Number(value) || 0)));
    setDurationSeconds(seconds);
    updateDuration(durationMinutes, seconds);
  };

  const handleDifficultyChange = (id: DifficultyId) => {
    setDifficulty(id);
    if (status === "idle") {
      const nextDifficulty = difficulties.find((diff) => diff.id === id) ?? currentDifficulty;
      setProblem(
        activeTab === "working-memory"
          ? generateWorkingMemoryProblem(workingMemoryOps, nextDifficulty)
          : generateProblem(activeOps, nextDifficulty),
      );
    }
  };

  const toggleOperation = (operation: Operation) => {
    setActiveOps((prev) => {
      if (prev.includes(operation)) {
        if (prev.length === 1) return prev;
        const updated = prev.filter((op) => op !== operation);
        if (status === "idle") {
          setProblem(generateProblem(updated, currentDifficulty));
        }
        return updated;
      }
      const extended = [...prev, operation];
      if (status === "idle") {
        setProblem(generateProblem(extended, currentDifficulty));
      }
      return extended;
    });
  };

  return (
    <div className="space-y-6">
      {showAdvancedOptions && (
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-lg shadow-zinc-500/5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Advanced Options
            </h2>
            <button
              onClick={() => setShowAdvancedOptions(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="Close advanced options"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={(e) => setAutoSubmit(e.target.checked)}
                className="h-5 w-5 rounded border-2 border-zinc-300 text-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-offset-0 dark:border-zinc-600"
              />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Auto Submit</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Automatically accept the answer when it's correct
                </p>
              </div>
            </label>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white/70 p-8 shadow-lg shadow-zinc-500/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">
              {status === "running" ? "Live round" : status === "finished" ? "Complete" : "Ready"}
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">
              Lightning arithmetic
            </h2>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <span>{Math.floor(timeLeft / 60).toString().padStart(2, "0")}</span>
            <span>:</span>
            <span>{(timeLeft % 60).toString().padStart(2, "0")}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-8 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>{currentDifficulty.label}</span>
            <span>
              {activeTab === "working-memory"
                ? `${workingMemoryOps} ops`
                : `${operationOptions.filter((op) => activeOps.includes(op.id)).length} ops`}
            </span>
          </div>

          <div className="flex flex-col items-center gap-6 py-10">
            <div
              className={`text-5xl font-bold tracking-tight text-zinc-900 transition duration-150 dark:text-white ${
                feedback === "correct"
                  ? "scale-105 text-emerald-500"
                  : feedback === "wrong"
                    ? "scale-95 text-rose-500"
                    : ""
              }`}
            >
              {status === "idle" && "Press start"}
              {status === "running" && problem.prompt}
              {status === "finished" && "Time!"}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-4 text-center sm:flex-row"
            >
              <input
                ref={inputRef}
                type="number"
                value={value}
                onChange={(event) => {
                  const newValue = event.target.value;
                  setValue(newValue);
                  checkAutoSubmit(newValue);
                }}
                placeholder={status === "running" ? "Type answer" : "Get ready"}
                disabled={status !== "running"}
                inputMode="numeric"
                className={`w-full rounded-2xl border px-5 py-4 text-center text-2xl font-semibold text-zinc-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:text-white ${
                  feedback === "correct"
                    ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300 dark:border-emerald-500 dark:bg-emerald-900/30"
                    : feedback === "wrong"
                      ? "border-rose-400 bg-rose-50 ring-2 ring-rose-300 dark:border-rose-500 dark:bg-rose-900/30"
                      : "border-zinc-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              />
              <button
                type="submit"
                disabled={status !== "running"}
                className="rounded-2xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <div>
              <p className="text-xs uppercase tracking-[0.3em]">Attempted</p>
              <p className="text-xl font-semibold text-zinc-900 dark:text-white">{attempted}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]">Correct</p>
              <p className="text-xl font-semibold text-emerald-500">{correct}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]">Accuracy</p>
              <p className="text-xl font-semibold">{accuracy}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]">Score</p>
              <p className="text-xl font-semibold text-sky-500">{score}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]">Pace</p>
              <p className="text-xl font-semibold">{pace || 0} /min</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          {status !== "running" ? (
            <button
              onClick={startRound}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black"
            >
              {status === "finished" ? "Run it back" : "Start round"}
            </button>
          ) : (
            <>
              <button
                onClick={finishRound}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-6 py-4 text-sm font-semibold text-zinc-900 transition hover:border-emerald-500 dark:border-zinc-700 dark:text-white"
              >
                End round
              </button>
              <button
                onClick={cancelRound}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-6 py-4 text-sm font-semibold text-rose-600 transition hover:border-rose-400 dark:border-rose-700 dark:text-rose-400"
              >
                Cancel
              </button>
            </>
          )}
          {status !== "running" && (
            <button
              onClick={() => {
                hasFinishedRef.current = false;
                setAttempted(0);
                setCorrect(0);
                setValue("");
                setTimeLeft(duration);
                setStatus("idle");
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 px-6 py-4 text-sm font-semibold text-emerald-600 transition hover:border-emerald-400"
            >
              Reset
            </button>
          )}
        </div>
        <div className="mt-6 flex flex-1 min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white/80 p-5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Run details</p>
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {selectedEntry
                  ? `${selectedEntry.correct}/${selectedEntry.attempted} · ${selectedEntry.duration}s`
                  : "No run selected"}
              </h4>
            </div>
            {selectedEntry && (
              <p className="text-xs text-zinc-500">
                {new Date(selectedEntry.createdAt).toLocaleString()}
              </p>
            )}
          </div>
          {!selectedEntry ? (
            <p className="mt-4 text-zinc-500">
              Finish a run or select one from the history panel to review each prompt.
            </p>
          ) : selectedEntry.problemAttempts.length === 0 ? (
            <p className="mt-4 text-zinc-500">No attempts recorded for this run.</p>
          ) : (
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
              {selectedEntry.problemAttempts.map((attempt, index) => {
                const stateClasses = attempt.isCorrect
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                  : "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-200";
                return (
                  <div
                    key={`${attempt.prompt}-${index}`}
                    className={`rounded-2xl border px-4 py-3 transition ${stateClasses}`}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                      <span>{attempt.operation}</span>
                      <span>{attempt.timeTaken}s</span>
                    </div>
                    <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-white">
                      {attempt.prompt}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span className="font-semibold">
                        Correct: <span className="font-normal">{attempt.answer}</span>
                      </span>
                      <span className="font-semibold">
                        You:{" "}
                        <span className="font-normal">
                          {Number.isNaN(attempt.userAnswer) ? "—" : attempt.userAnswer}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-lg shadow-zinc-500/5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Duration</p>
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={durationMinutes}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    disabled={status === "running"}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                    Seconds
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationSeconds}
                    onChange={(e) => handleSecondsChange(e.target.value)}
                    disabled={status === "running"}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Difficulty</p>
              <div className="mt-3 grid gap-2">
                {difficulties.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => handleDifficultyChange(diff.id)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      diff.id === difficulty
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{diff.label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{diff.description}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      {diff.min}-{diff.max}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-3">Section</p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setActiveTab("operations")}
                  className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "operations"
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  Operations
                </button>
                <button
                  onClick={() => setActiveTab("working-memory")}
                  className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "working-memory"
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  Working Memory
                </button>
              </div>
              {activeTab === "operations" && (
                <div className="grid grid-cols-2 gap-2">
                  {operationOptions.map((option) => {
                    const isActive = activeOps.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleOperation(option.id)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}
                      >
                        <span className="text-lg">{option.symbol}</span> {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {activeTab === "working-memory" && (
                <div>
                  <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                    Number of operations
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={workingMemoryOps}
                    onChange={(e) => {
                      const val = Math.max(1, Math.floor(Number(e.target.value) || 1));
                      setWorkingMemoryOps(val);
                      if (status === "idle") {
                        setProblem(generateWorkingMemoryProblem(val, currentDifficulty));
                      }
                    }}
                    disabled={status === "running"}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setShowAdvancedOptions(true)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Advanced Options
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-lg shadow-zinc-500/5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">History</p>
          <h3 className="pb-4 text-xl font-semibold text-zinc-900 dark:text-white">
            Recent rounds
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Finish a run to see accuracy, score, and pace highlights.
            </p>
          ) : (
            <ul className="space-y-3">
              {history.slice(0, 5).map((entry) => (
                <li key={entry.id}>
                  <button
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      entry.id === selectedEntryId
                        ? "border-emerald-400 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-900/30 dark:text-emerald-200"
                        : "border-zinc-100 bg-zinc-50/80 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                          {new Date(entry.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-base font-semibold text-zinc-900 dark:text-white">
                          {entry.correct} / {entry.attempted} correct
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-emerald-600">{entry.score} pts</p>
                        <p className="text-zinc-500">{Math.round(entry.pace)} /min</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Accuracy {entry.accuracy}% · {entry.duration}s
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

