import Link from "next/link";
import { Section } from "@/components/Section";
import { fmt } from "@/lib/format";
import type { PlayerData, PlayerSeasonRecord } from "@/lib/types";
import { OwnerNames, RecordTableTitle } from "./shared";

type Metric = "total_points" | "bench_points" | "starting_points" | "ppg_started";

export default function PlayerSeasonRecords({ records, currentYear }: {
  records: PlayerData["regular_season_records"];
  currentYear: number;
}) {
  return (
    <>
      <Section eyebrow="Season Greats" title="Top regular-season performances by position"
        subtitle="The 15 highest-scoring player seasons at each position, across recorded starter and bench weeks. Fantasy-team changes are combined into one player season.">
        <p className="mb-4 text-sm text-[#766d61]">
          ESPN player coverage starts in 2019; 2021 is excluded. Only weeks on a recorded active roster count; IR and unrostered weeks are excluded. Games means recorded lineup weeks, including byes and inactive weeks, rather than confirmed NFL appearances. {currentYear} totals are season to date.
        </p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {Object.entries(records.top_by_position).map(([position, rows]) => (
            <PlayerSeasonTable key={position} title={`${position} — highest regular-season points`} rows={rows} metric="total_points" currentYear={currentYear} />
          ))}
        </div>
      </Section>
      <Section eyebrow="Lineup Decisions" title="Season-long bench regrets and starter struggles"
        subtitle={`Bench totals include every recorded BE week. Starter lows and averages require at least ${records.minimum_starts} regular-season starts. Points and game counts use only the listed lineup role.`}>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <PlayerSeasonTable title="Most points left on the bench" rows={records.most_bench_points} metric="bench_points" currentYear={currentYear} />
          <PlayerSeasonTable title="Fewest points as a starter" rows={records.lowest_starting_points} metric="starting_points" currentYear={currentYear} />
          <PlayerSeasonTable title="Best starter points per game" rows={records.best_starter_ppg} metric="ppg_started" currentYear={currentYear} />
          <PlayerSeasonTable title="Worst starter points per game" rows={records.worst_starter_ppg} metric="ppg_started" currentYear={currentYear} />
        </div>
      </Section>
    </>
  );
}

function PlayerSeasonTable({ title, rows, metric, currentYear }: {
  title: string;
  rows: PlayerSeasonRecord[];
  metric: Metric;
  currentYear: number;
}) {
  const gamesKey = metric === "total_points" ? "games_rostered" : metric === "bench_points" ? "games_benched" : "games_started";
  return (
    <div className="table-shell min-w-0 max-h-[420px] overflow-auto rounded-lg">
      <RecordTableTitle>{title}</RecordTableTitle>
      <table className="min-w-full text-sm">
        <thead className="sticky top-11 z-10">
          <tr>{["Rank", "Player / Season", "Fantasy Team(s)", "Games", metric === "ppg_started" ? "PPG" : "Pts"].map((label, i) => (
            <th key={label} scope="col" className={`px-3 py-3 text-xs font-black uppercase tracking-[0.14em] ${i >= 3 ? "text-right" : "text-left"}`}>{label}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.year}-${row.player_id}`} className="border-t border-black/5">
              <td className="px-3 py-2.5 align-top"><span className="rank-medal" data-rank={index + 1}>{index + 1}</span></td>
              <td className="px-3 py-2.5 align-top">
                <div className="font-bold">{row.player_name}</div>
                <Link href={`/seasons/${row.year}`} className="text-xs text-[#766d61] hover:underline">{row.position} · {row.year}{row.year === currentYear ? " · so far" : ""}</Link>
              </td>
              <td className="px-3 py-2.5 align-top">{row.fantasy_teams.map(team => (
                <div key={team.team_id} className="mb-1 last:mb-0">
                  <OwnerNames names={team.owner_names} ids={team.owner_ids} className="font-bold" />
                  <div className="text-[11px] text-[#766d61]">{team.team_name}</div>
                </div>
              ))}</td>
              <td className="px-3 py-2.5 text-right align-top font-semibold tabular-nums">
                {row[gamesKey]}
                <div className="text-[10px] text-[#766d61]">{metric === "total_points" ? `${row.games_started} starts` : metric === "bench_points" ? "benched" : "starts"}</div>
              </td>
              <td className="px-3 py-2.5 text-right align-top font-black tabular-nums">{fmt.pts(row[metric])}
                {metric === "ppg_started" && <div className="text-[10px] font-semibold text-[#766d61]">{fmt.pts(row.starting_points)} pts</div>}
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="px-3 py-6 text-[#766d61]">No qualifying player seasons yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
