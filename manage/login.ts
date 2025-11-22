import { auth, signIn, signOut } from "@/auth";

import { prisma } from "../prisma/client";

export async function fetchUser(email: string) {
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })
    return user
}

export async function postLogin() {
    const session = await auth();
    if (!session?.user) return;
    if (!session.user.email) return;
    const user = await fetchUser(session.user.email);
    if (!user) {
        await prisma.user.create({
            data: {
                email: session.user.email,
                name: session.user.name
            }
        })
    }
}