"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma/client";

type DifficultyId = "sparks" | "balanced" | "insane";

export async function fetchHistory() {
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
                take: 50,
            },
        },
    });

    if (!user) return [];

    const history = user.history;



    return history.map((entry) => ({
        id: entry.id,
        duration: entry.duration,
        timeTaken: entry.timeTaken,
        difficulty: (entry.difficulty as DifficultyId) ?? "balanced",
        maxDecimalPlaces: entry.maxDecimalPlaces ?? 0,
        operations: entry.operations,
        correct: entry.correct,
        attempted: entry.attempted,
        score: entry.score,
        accuracy: entry.accuracy,
        pace: entry.pace,
        problemAttempts: entry.problemAttempts.map((attempt) => ({
            prompt: attempt.prompt,
            answer: attempt.answer,
            userAnswer: attempt.userAnswer,
            operation: attempt.operation,
            isCorrect: attempt.isCorrect,
            timeTaken: attempt.timeTaken,
        })),
        createdAt: entry.createdAt.toISOString(),
    }));
}

export async function saveHistoryEntry(data: {
    duration: number;
    timeTaken: number;
    difficulty: DifficultyId;
    maxDecimalPlaces: number;
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
            timeTaken: data.timeTaken,
            difficulty: data.difficulty,
            maxDecimalPlaces: data.maxDecimalPlaces,
            operations: data.operations,
            correct: data.correct,
            attempted: data.attempted,
            score: data.score,
            accuracy: data.accuracy,
            pace: data.pace,
            problemAttempts: {
                create: data.problemAttempts.map((attempt) => ({
                    prompt: attempt.prompt,
                    answer: attempt.answer,
                    userAnswer: attempt.userAnswer,
                    operation: attempt.operation,
                    isCorrect: attempt.isCorrect,
                    timeTaken: attempt.timeTaken,
                })),
            },
        },
        include: {
            problemAttempts: true,
        },
    });

    return {
        id: historyEntry.id,
        duration: historyEntry.duration,
        timeTaken: historyEntry.timeTaken,
        difficulty: (historyEntry.difficulty as DifficultyId) ?? "balanced",
        maxDecimalPlaces: historyEntry.maxDecimalPlaces ?? 0,
        operations: historyEntry.operations,
        correct: historyEntry.correct,
        attempted: historyEntry.attempted,
        score: historyEntry.score,
        accuracy: historyEntry.accuracy,
        pace: historyEntry.pace,
        problemAttempts: historyEntry.problemAttempts.map((attempt) => ({
            prompt: attempt.prompt,
            answer: attempt.answer,
            userAnswer: attempt.userAnswer,
            operation: attempt.operation,
            isCorrect: attempt.isCorrect,
            timeTaken: attempt.timeTaken,
        })),
        createdAt: historyEntry.createdAt.toISOString(),
    };
}

