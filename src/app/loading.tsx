export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground transition-colors duration-300 animate-pulse">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <div className="space-y-4">
          <div className="h-12 w-72 md:w-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-20 w-full max-w-2xl rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="h-20 rounded-3xl bg-slate-200 dark:bg-slate-800" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="h-[520px] rounded-3xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
