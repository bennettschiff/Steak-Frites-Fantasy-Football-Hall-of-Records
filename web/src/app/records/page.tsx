import Link from "next/link";
import { loadMeta, loadPlayers, loadRecords, loadSeason } from "@/lib/data";
import { fmt } from "@/lib/format";
import RecordBookTabs from "@/components/records/RecordBookTabs";
import { recordHighlights } from "@/lib/record-highlights";
import PlayerSeasonRecords from "@/components/records/PlayerSeasonRecords";
import PlayerRecordsSections, { OpeningWeekPlayers, PlayerSeasonHistory } from "@/components/records/PlayerRecordsSections";

export const metadata = { title: "Records — Steak Frites" };

export default function RecordsPage() {
  const r = loadRecords();
  const players = loadPlayers();
  const meta = loadMeta();
  const currentYear = meta.current_year;
  const season = loadSeason(currentYear);
  const completedWeeks = season.matchups.filter(m => m.home_score != null && m.away_score != null && (m.home_score > 0 || m.away_score > 0)).map(m => m.week);
  const latestWeek = Math.max(0, ...completedWeeks);
  const regularSeasonWeeks = season.settings.reg_season_count ?? 14;
  const highlights = recordHighlights(r, players, currentYear, Math.min(latestWeek, regularSeasonWeeks), latestWeek >= regularSeasonWeeks);
  const playerRecords = {
    all_time_top_by_position: players.all_time_top_by_position,
    winning_team_appearances: players.winning_team_appearances,
    opening_week_top: players.opening_week_top,
    biggest_bench_scores: players.biggest_bench_scores,
    biggest_carry_jobs: players.biggest_carry_jobs,
    mvps_by_season: players.mvps_by_season,
    methodology: players.methodology,
    coverage: players.coverage,
  };

  return (
    <div className="space-y-12">
      <header className="club-panel overflow-hidden rounded-xl">
        <div className="border-b border-white/10 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#f7d77d]">
          {currentYear} record watch · All-time top three
        </div>
        <div className="grid min-w-0 gap-8 p-6 md:grid-cols-[1fr_1.2fr] md:p-10">
          <div className="min-w-0">
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">The Record Book</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#f7edda]/78">
              The scores people remember, the losses nobody lives down, and the NFL players who detonated a fantasy week.
            </p>
            <p className="mt-6 text-sm text-[#f7edda]/68">
              {highlights.length ? `${highlights.length} top-three entries from ${currentYear}, newest first.` : `No all-time top-three records from ${currentYear} yet.`}
              {" "}Season lows and averages join the watch after the regular season ends.
            </p>
            {highlights.length > 5 && <p className="mt-3 text-xs font-bold text-[#f7d77d]">Scroll to see all {highlights.length} entries ↓</p>}
          </div>
          <div className="min-w-0 border-white/10 md:border-l md:pl-7">
            {highlights.length ? (
              <ol aria-label={`${currentYear} all-time top-three records, newest first`} tabIndex={highlights.length > 5 ? 0 : undefined}
                className="max-h-[440px] overflow-y-auto overscroll-contain pr-3 focus-visible:outline-2 focus-visible:outline-[#f7d77d]">
                {highlights.map(record => (
                  <li key={record.id} className="h-[88px] border-b border-white/10 last:border-b-0">
                    <a href={record.href} className="flex h-full min-w-0 items-center gap-3 rounded px-1 hover:bg-white/5">
                      <span className="rank-medal shrink-0" data-rank={record.rank} aria-label={`Rank ${record.rank}`}>{record.rank}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#f7d77d]" title={record.label}>{record.label}</div>
                        <div className="truncate text-sm font-black" title={record.holder}>{record.holder}</div>
                        <div className="truncate text-xs text-[#f7edda]/65" title={record.detail}>{currentYear} W{record.week} · {record.detail}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-lg font-black tabular-nums text-[#f7d77d]">{fmt.pts(record.value)}</div>
                        <div className="text-[10px] text-[#f7edda]/65">{record.unit}</div>
                      </div>
                    </a>
                  </li>
                ))}
              </ol>
            ) : <p className="py-6 text-sm text-[#f7edda]/68">The next historic performance will show up here automatically.</p>}
          </div>
        </div>
        {Object.keys(r.excluded_years).length > 0 && (
          <div className="border-t border-white/10 bg-white/[0.04] px-6 py-3 text-xs font-medium text-[#f7edda]/68">
            <strong>Note:</strong> Records do not include{" "}
            {Object.entries(r.excluded_years)
              .map(([y, note]) => `${y} (${note})`)
              .join("; ")}
          </div>
        )}
      </header>

      <RecordBookTabs
        records={{
          opening_week_highest: r.opening_week_highest,
          opening_week_lowest: r.opening_week_lowest,
          game_records: r.game_records,
          highest_season_pf: r.highest_season_pf,
          lowest_season_pf: r.lowest_season_pf,
          best_season_ppg: r.best_season_ppg,
          worst_season_ppg: r.worst_season_ppg,
          streaks: r.streaks,
        }}
        playerContent={<PlayerRecordsSections players={playerRecords} />}
        playerSeasonContent={<PlayerSeasonRecords records={players.regular_season_records} currentYear={currentYear} />}
        seasonHistoryContent={<PlayerSeasonHistory players={playerRecords} />}
        openingPlayerContent={<OpeningWeekPlayers players={playerRecords} />}
      />

      <Link
        href="/champions"
        className="group flex items-center justify-between gap-4 rounded-xl border border-[#123d35]/20 bg-gradient-to-r from-[#123d35] to-[#1b5a4d] px-6 py-5 text-white shadow-sm transition hover:shadow-lg hover:from-[#0e3128] hover:to-[#17483e]"
      >
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#f7d77d]">Looking for the trophy shelf?</div>
          <div className="mt-1 text-xl font-black">Champions, Runners-up & Bronze →</div>
          <div className="mt-1 text-sm text-white/75">Year-by-year podium with championship counts per owner.</div>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f7d77d] text-2xl font-black text-[#123d35] transition group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
