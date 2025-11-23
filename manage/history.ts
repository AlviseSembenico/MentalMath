"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma/client";

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
        })),
        createdAt: entry.createdAt.toISOString(),
    }));
}

export async function saveHistoryEntry(data: {
    duration: number;
    timeTaken: number;
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
        })),
        createdAt: historyEntry.createdAt.toISOString(),
    };
}

