import {format, parseISO} from "date-fns";
import {enUS, id as localeId} from "date-fns/locale";
import {redirect} from "next/navigation";
import {getMessages, createTranslator} from "../../../i18n/request";
import {createServerClientWithCookies} from "../../../lib/supabaseServer";
import GenerateWeeklyButton from "../../../components/weekly/GenerateWeeklyButton";

export const revalidate = 0;

export default async function WeeklyPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const supabase = await createServerClientWithCookies();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectTo=/weekly`);
  }

  const {data: recaps, error} = await supabase
    .from("weekly_summaries")
    .select("id, week_start, week_end, summary, ai_suggestion, created_at")
    .eq("user_id", user.id)
    .order("week_start", {ascending: false});

  const localeMap = {
    id: localeId,
    en: enUS,
  } as const;
  const selectedLocale = localeMap[locale as keyof typeof localeMap] ?? localeId;

  const messages = await getMessages(locale);
  const t = createTranslator(messages);

  return (
    <div className='relative min-h-screen overflow-hidden bg-linear-to-br from-indigo-950 via-slate-900 to-zinc-950 text-white'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_65%_15%,rgba(255,255,255,0.18),transparent_55%)]' />
      <div className='absolute left-16 bottom-20 hidden h-40 w-40 rounded-full bg-blue-400/30 blur-[120px] lg:block' />
      <main className='relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-20'>
        <header className='space-y-4'>
          <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-white/70'>
            {t("weekly.badge")}
          </span>
          <h1 className='text-3xl font-semibold sm:text-5xl'>
            {t("weekly.title")}
          </h1>
          <p className='max-w-2xl text-base text-white/70 sm:text-lg'>
            {t("weekly.description")}
          </p>
        </header>

        <section className='flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-3'>
            <h2 className='text-xl font-semibold text-white'>
              {t("weekly.generate.title")}
            </h2>
            <p className='text-sm text-white/70'>
              {t("weekly.generate.description")}
            </p>
          </div>
          <GenerateWeeklyButton />
        </section>

        <section className='space-y-6 pb-16'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h2 className='text-2xl font-semibold text-white'>
              {t("weekly.history.title")}
            </h2>
            <p className='text-xs uppercase tracking-wide text-white/50'>
              {t("weekly.history.subtitle")}
            </p>
          </div>

          {error && (
            <p className='rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
              {t("weekly.errors.load", {message: error.message})}
            </p>
          )}

          {!recaps || recaps.length === 0 ? (
            <div className='rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white/70 sm:p-10'>
              <h3 className='text-xl font-semibold text-white'>
                {t("weekly.history.emptyTitle")}
              </h3>
              <p className='mt-2 text-sm text-white/60'>
                {t("weekly.history.emptyDescription")}
              </p>
            </div>
          ) : (
            <div className='grid gap-6'>
              {recaps.map((recap) => {
                const start = parseISO(recap.week_start);
                const end = parseISO(recap.week_end);
                const rangeText = `${format(start, "d MMMM yyyy", {locale: selectedLocale})} - ${format(end, "d MMMM yyyy", {locale: selectedLocale})}`;

                return (
                  <article
                    key={recap.id}
                    className='grid gap-4 rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur sm:p-8 md:grid-cols-2'>
                    <div className='space-y-3'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-white/50'>
                        {t("weekly.card.range")}
                      </p>
                      <h3 className='text-lg font-semibold text-white'>
                        {rangeText}
                      </h3>
                      <p className='text-xs text-white/50'>
                        {t("weekly.card.generatedAt")}{" "}
                        {format(parseISO(recap.created_at), "d MMMM yyyy HH:mm", {
                          locale: selectedLocale,
                        })}
                      </p>
                    </div>
                    <div className='space-y-5'>
                      <div className='rounded-2xl border border-white/10 bg-white/5 p-5'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-emerald-200'>
                          {t("weekly.card.summary")}
                        </p>
                        <p className='mt-2 text-sm text-white/80'>
                          {recap.summary ?? t("common.noData")}
                        </p>
                      </div>
                      <div className='rounded-2xl border border-white/10 bg-white/5 p-5'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-blue-200'>
                          {t("weekly.card.suggestion")}
                        </p>
                        <p className='mt-2 text-sm text-white/80'>
                          {recap.ai_suggestion ?? t("common.noData")}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
