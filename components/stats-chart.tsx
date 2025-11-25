"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StatsDataPoint } from "@/manage/stats";

type DifficultyId = "sparks" | "balanced" | "insane";

const categoryColors: Record<string, string> = {
  addition: "#10b981",
  subtraction: "#3b82f6",
  multiplication: "#f59e0b",
  division: "#ef4444",
  square: "#8b5cf6",
  overall: "#6366f1",
};

const categoryLabels: Record<string, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
  square: "Square",
  overall: "Overall Mean",
};

const difficultySections: {
  id: DifficultyId;
  heading: string;
  badge: string;
  description: string;
}[] = [
  {
    id: "sparks",
    heading: "Easy Rounds",
    badge: "Sparks difficulty",
    description: "Single-digit focus rounds for raw reaction time.",
  },
  {
    id: "balanced",
    heading: "Mid Rounds",
    badge: "Balanced difficulty",
    description: "Classic training mix for sustainable pace.",
  },
  {
    id: "insane",
    heading: "Hard Rounds",
    badge: "Insane difficulty",
    description: "High-intensity two-digit challenges.",
  },
];

type Props = {
  data: StatsDataPoint[];
};

export default function StatsChart({ data }: Props) {
  const categories = Array.from(new Set(data.map((d) => d.category))).sort((a, b) => {
    if (a === "overall") return 1;
    if (b === "overall") return -1;
    return a.localeCompare(b);
  });

  const buildChartData = (points: StatsDataPoint[]) => {
    const sessions = Array.from(new Set(points.map((d) => d.sessionId))).sort(
      (a, b) => a - b
    );

    return sessions
      .map((sessionId) => {
        const sessionData = points.filter((d) => d.sessionId === sessionId);
        const firstEntry = sessionData[0];
        if (!firstEntry) return null;

        const sessionDate = new Date(firstEntry.sessionDate);
        const sessionLabel = `${sessionDate.toLocaleDateString()} ${sessionDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

        const result: Record<string, string | number | null> = {
          session: `Session ${sessions.indexOf(sessionId) + 1}`,
          sessionDate: sessionLabel,
        };

        for (const category of categories) {
          const categoryData = sessionData.find((d) => d.category === category);
          result[categoryLabels[category]] = categoryData ? categoryData.averageTime : null;
        }

        return result;
      })
      .filter((item): item is Record<string, string | number | null> => item !== null);
  };

  const dataByDifficulty: Record<DifficultyId, ReturnType<typeof buildChartData>> =
    difficultySections.reduce((acc, section) => {
      const filteredPoints = data.filter((point) => point.difficulty === section.id);
      return {
        ...acc,
        [section.id]: buildChartData(filteredPoints),
      };
    }, {} as Record<DifficultyId, ReturnType<typeof buildChartData>>);

  return (
    <div className="w-full space-y-12">
      {difficultySections.map((section) => {
        const chartData = dataByDifficulty[section.id];
        const hasData = chartData.some(Boolean);

        return (
          <div key={section.id} className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">{section.badge}</p>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{section.heading}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{section.description}</p>
            </div>

            {hasData ? (
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                  <XAxis
                    dataKey="session"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    className="text-xs fill-zinc-600 dark:fill-zinc-400"
                  />
                  <YAxis
                    label={{ value: "Average Time (seconds)", angle: -90, position: "insideLeft" }}
                    className="text-xs fill-zinc-600 dark:fill-zinc-400"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e4e4e7",
                      borderRadius: "12px",
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "#18181b", fontWeight: 600 }}
                    formatter={(value: any) => {
                      if (value === null || value === undefined || typeof value !== "number") return "N/A";
                      return `${value.toFixed(1)}s`;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
                  {categories.map((category) => (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={categoryLabels[category]}
                      stroke={categoryColors[category] || "#6b7280"}
                      strokeWidth={category === "overall" ? 3 : 2}
                      dot={{ r: category === "overall" ? 5 : 4 }}
                      activeDot={{ r: category === "overall" ? 7 : 6 }}
                      connectNulls={false}
                      strokeDasharray={category === "overall" ? "5 5" : "0"}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                No training sessions recorded for this difficulty yet.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

