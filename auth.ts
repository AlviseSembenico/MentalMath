import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.picture =
          token.picture ??
          (typeof profile.picture === "string" ? profile.picture : undefined);
        token.name =
          token.name ?? (typeof profile.name === "string" ? profile.name : undefined);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image =
          session.user.image ?? (typeof token.picture === "string" ? token.picture : undefined);
        session.user.name =
          session.user.name ?? (typeof token.name === "string" ? token.name : undefined);
      }
      return session;
    },
  },
});


