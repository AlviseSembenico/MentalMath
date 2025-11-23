"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma/client";

export async function fetchHistory() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            history: true,
        },
    });

    if (!user) return [];

    const history = user.history;



    return history.map((entry) => ({
        id: entry.id,
        duration: entry.duration,
        correct: entry.correct,
        attempted: entry.attempted,
        score: entry.score,
        accuracy: entry.accuracy,
        pace: entry.pace,
        createdAt: entry.createdAt.toISOString(),
    }));
}

export async function saveHistoryEntry(data: {
    duration: number;
    correct: number;
    attempted: number;
    score: number;
    accuracy: number;
    pace: number;
}) {
    const session = await auth();
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return null;

    const historyEntry = await prisma.history.create({
        data: {
            userId: user.id,
            duration: data.duration,
            correct: data.correct,
            attempted: data.attempted,
            score: data.score,
            accuracy: data.accuracy,
            pace: data.pace,
        },
    });

    return {
        id: historyEntry.id,
        duration: historyEntry.duration,
        correct: historyEntry.correct,
        attempted: historyEntry.attempted,
        score: historyEntry.score,
        accuracy: historyEntry.accuracy,
        pace: historyEntry.pace,
        createdAt: historyEntry.createdAt.toISOString(),
    };
}

