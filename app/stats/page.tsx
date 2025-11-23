import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchStatsData } from "@/manage/stats";
import StatsChart from "@/components/stats-chart";

export default async function StatsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/");
  }

  const statsData = await fetchStatsData();

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
                Performance Statistics
              </h1>
            </div>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 dark:border-zinc-700 dark:text-white"
          >
            ← Back to Trainer
          </a>
        </header>

        <div className="rounded-3xl border border-zinc-200/80 bg-white/70 p-8 shadow-lg shadow-zinc-500/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Analytics</p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Average Response Time by Category
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Track your performance across different operation types over time
            </p>
          </div>
          
          {statsData.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-12 text-center dark:border-zinc-800 dark:bg-zinc-800/60">
              <p className="text-zinc-500 dark:text-zinc-400">
                No data available yet. Complete some training sessions to see your statistics.
              </p>
            </div>
          ) : (
            <StatsChart data={statsData} />
          )}
        </div>
      </div>
    </div>
  );
}

