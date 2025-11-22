import { auth, signIn, signOut } from "@/auth";
import MathTrainer from "@/components/math-trainer";
import Image from "next/image";

export default async function Home() {
  const session = await auth();

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
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
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
                </div>
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

        <section className="rounded-3xl border border-zinc-200/80 bg-white/80 p-8 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-sky-500">Open practice</p>
              <h2 className="text-4xl font-semibold leading-tight text-zinc-900 dark:text-white">
                Zetamac speed drills, but calmer visuals and richer stats.
              </h2>
              <p className="text-base text-zinc-600 dark:text-zinc-300">
                Pick your operators, choose a timer, then race through clean, legible prompts. We
                track accuracy, custom scoring, and pace so you know exactly when to flex or reset.
              </p>
              <ul className="flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="rounded-full border border-zinc-200 px-4 py-2 dark:border-zinc-700">
                  Live scoreboard
                </li>
                <li className="rounded-full border border-zinc-200 px-4 py-2 dark:border-zinc-700">
                  Custom routines
                </li>
                <li className="rounded-full border border-zinc-200 px-4 py-2 dark:border-zinc-700">
                  Recent history
                </li>
              </ul>
            </div>
            <div className="grid gap-4 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Mode</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">Timer sprint</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Best pace</p>
                <p className="text-lg font-semibold text-emerald-500">40 / min</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Max score</p>
                <p className="text-lg font-semibold text-sky-500">200 pts</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Active ops</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">+ − × ÷</p>
              </div>
            </div>
          </div>
        </section>

        <MathTrainer />
      </div>
    </div>
  );
}
