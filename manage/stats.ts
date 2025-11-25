"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma/client";

type DifficultyId = "sparks" | "balanced" | "insane";

export type StatsDataPoint = {
  sessionId: number;
  sessionDate: string;
  category: string;
  averageTime: number;
  difficulty: DifficultyId;
};

export async function fetchStatsData(): Promise<StatsDataPoint[]> {
  const session = await auth();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      history: {
        include: {
          problemAttempts: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!user) return [];

  const stats: StatsDataPoint[] = [];

  for (const historyEntry of user.history) {
    const attemptsByCategory = new Map<string, number[]>();
    const difficulty = (historyEntry.difficulty as DifficultyId) ?? "balanced";

    for (const attempt of historyEntry.problemAttempts) {
      const category = attempt.operation;
      if (!attemptsByCategory.has(category)) {
        attemptsByCategory.set(category, []);
      }
      attemptsByCategory.get(category)!.push(attempt.timeTaken);
    }

    for (const [category, times] of attemptsByCategory.entries()) {
      if (times.length > 0) {
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        stats.push({
          sessionId: historyEntry.id,
          sessionDate: historyEntry.createdAt.toISOString(),
          category,
          averageTime: Math.round(averageTime * 10) / 10,
          difficulty,
        });
      }
    }

    if (historyEntry.problemAttempts.length > 0) {
      const totalTime = historyEntry.problemAttempts.reduce((sum, attempt) => sum + attempt.timeTaken, 0);
      const overallAverage = totalTime / historyEntry.problemAttempts.length;
      stats.push({
        sessionId: historyEntry.id,
        sessionDate: historyEntry.createdAt.toISOString(),
        category: "overall",
        averageTime: Math.round(overallAverage * 10) / 10,
        difficulty,
      });
    }
  }

  return stats.sort((a, b) => 
    new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
  );
}

