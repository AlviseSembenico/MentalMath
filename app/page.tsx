import { auth, signIn, signOut } from "@/auth";

import Image from "next/image";
import MathTrainer from "@/components/math-trainer";
import { postLogin } from "@/manage/login";

export default async function Home() {
  const session = await auth();
  
  if (session?.user) {
    await postLogin();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f7fa,_#f5f5f5_35%,_#fdfbf7)] pb-16 pt-10 dark:bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_60%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-6 rounded-3xl border border-zinc-200/80 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-2xl font-black text-white dark:from-white dark:to-zinc-200 dark:text-black">
              M
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">mmath</p>
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">
                Competitive mental math
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {session?.user ? (
              <>
                <a
                  href="/stats"
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-600 transition hover:border-zinc-900 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600"
                >
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "Avatar"}
                      width={40}
                      height={40}
                      className="rounded-full border border-white/70"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Signed in</p>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {session.user.name ?? "Google user"}
                    </p>
                  </div>
                </a>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 dark:border-zinc-700 dark:text-white">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google");
                }}
              >
                <button className="inline-flex items-center gap-3 rounded-2xl border border-zinc-300 bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:hover:border-white">
                  <Image src="/google.svg" width={18} height={18} alt="Google" />
                  Continue with Google
                </button>
              </form>
            )}
          </div>
        </header>


        <MathTrainer />
      </div>
    </div>
  );
}
