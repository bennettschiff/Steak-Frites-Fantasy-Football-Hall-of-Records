import type { PlayerData, Records } from "./types";

export type RecordHighlight = {
  id: string;
  rank: number;
  week: number;
  label: string;
  holder: string;
  detail: string;
  value: number;
  unit: string;
  href: string;
};

/** Rank matches the displayed leaderboard; newest week comes first. */
export function recordHighlights(records: Records, players: PlayerData, year: number, latestWeek: number, regularSeasonComplete: boolean): RecordHighlight[] {
  const highlights: RecordHighlight[] = [];
  function add<T extends { year: number }>(rows: T[], label: string, href: string, describe: (row: T) => Omit<RecordHighlight, "id" | "rank" | "label" | "href">) {
    rows.slice(0, 3).forEach((row, index) => {
      if (row.year !== year) return;
      highlights.push({ id: `${href}-${label}-${index}`, rank: index + 1, label, href: `/records#${href}`, ...describe(row) });
    });
  }
  for (const [scope, set] of Object.entries(records.game_records)) {
    const tab = scope === "regular_season" ? "single-week" : scope === "championships" ? "championship" : "playoffs";
    const prefix = scope === "regular_season" ? "Regular season" : scope === "championships" ? "Championship" : "Playoffs";
    for (const [key, label] of [
      ["highest_scores", "highest score"], ["lowest_scores", "lowest score"],
      ["highest_losing_scores", "highest score in a loss"], ["lowest_winning_scores", "lowest score in a win"],
    ] as const) {
      add(set[key], `${prefix} · ${label}`, tab, row => ({
        week: row.week, holder: row.owners.join(" & "), value: row.score, unit: "pts",
        detail: `${row.team} · vs ${row.opp_owners.join(" & ")}`, 
      }));
    }
    for (const [key, label, metric] of [
      ["biggest_blowouts", "biggest blowout", "margin"], ["closest_games", "closest game", "margin"],
      ["highest_combined", "highest combined score", "combined"], ["lowest_combined", "lowest combined score", "combined"],
    ] as const) {
      add(set[key], `${prefix} · ${label}`, tab, row => ({
        week: row.week, holder: `${row.home_owners.join(" & ")} vs ${row.away_owners.join(" & ")}`,
        detail: `${row.home_team} vs ${row.away_team}`, value: row[metric], unit: metric === "margin" ? "pt margin" : "combined pts",
      }));
    }
  }
  for (const [key, label] of [["opening_week_highest", "Week 1 · highest score"], ["opening_week_lowest", "Week 1 · lowest score"]] as const) {
    add(records[key], label, "week-one", row => ({ week: row.week, holder: row.owners.join(" & "), detail: row.team, value: row.score, unit: "pts" }));
  }
  for (const [position, rows] of Object.entries(players.all_time_top_by_position)) {
    add(rows, `${position} · highest single-week score`, "nfl-players", row => ({
      week: row.week, holder: row.player_name, detail: `${row.owner_names.join(" & ")} · ${row.team_name}`, value: row.points, unit: "pts",
    }));
  }
  for (const [key, label, metric] of [
    ["biggest_bench_scores", "Most points left on the bench", "points"],
    ["biggest_carry_jobs", "Biggest one-player carry job", "team_share"],
    ["opening_week_top", "Week 1 · highest player score", "points"],
  ] as const) {
    add(players[key], label, key === "opening_week_top" ? "week-one" : "nfl-players", row => ({
      week: row.week, holder: row.player_name, detail: row.owner_names.join(" & "),
      value: metric === "team_share" ? (row.team_share ?? 0) * 100 : row.points, unit: metric === "team_share" ? "% of team score" : "pts",
    }));
  }
  for (const kind of ["win", "loss"] as const) {
    const score = kind === "win" ? "longest_win_streak" : "longest_loss_streak";
    const range = kind === "win" ? "win_streak_range" : "loss_streak_range";
    [...records.streaks].sort((a, b) => b[score] - a[score]).slice(0, 3).forEach((row, index) => {
      const dates = row[range];
      if (!dates || dates[1][0] !== year || row[score] === 0) return;
      highlights.push({
        id: `streak-${kind}-${row.owner_id}`, rank: index + 1, week: dates[1][1],
        label: `Longest ${kind === "win" ? "winning" : "losing"} streak`,
        holder: row.display_name, detail: `From ${dates[0][0]} W${dates[0][1]} to ${dates[1][0]} W${dates[1][1]}`,
        value: row[score], unit: "straight games", href: "/records#seasons",
      });
    });
  }
  // Cumulative highs can qualify in progress; lows and averages need a full season.
  for (const [key, label, metric] of [
    ["highest_season_pf", "Highest season points", "points_for"], ["lowest_season_pf", "Lowest season points", "points_for"],
    ["best_season_ppg", "Best season PPG", "ppg"], ["worst_season_ppg", "Worst season PPG", "ppg"],
  ] as const) {
    if (!regularSeasonComplete && key !== "highest_season_pf") continue;
    add(records[key], label, "season", row => ({ week: latestWeek, holder: row.owner_names.join(" & "), detail: row.team, value: row[metric], unit: metric === "ppg" ? "PPG" : "pts" }));
  }
  const season = players.regular_season_records;
  const boards = [
    ...Object.entries(season.top_by_position).map(([position, rows]) => ({ rows, label: `${position} · highest regular-season points`, metric: "total_points" as const })),
    { rows: season.most_bench_points, label: "Most season bench points", metric: "bench_points" as const },
    { rows: season.lowest_starting_points, label: "Fewest season starter points", metric: "starting_points" as const },
    { rows: season.best_starter_ppg, label: "Best season starter PPG", metric: "ppg_started" as const },
    { rows: season.worst_starter_ppg, label: "Worst season starter PPG", metric: "ppg_started" as const },
  ];
  for (const { rows, label, metric } of boards) {
    if (!regularSeasonComplete && metric !== "total_points" && metric !== "bench_points") continue;
    add(rows, label, "nfl-player-season", row => ({
      week: latestWeek, holder: row.player_name, detail: row.fantasy_teams.map(t => t.owner_names.join(" & ")).join(" / "),
      value: row[metric], unit: metric === "ppg_started" ? "PPG" : "pts",
    }));
  }
  return highlights.sort((a, b) => b.week - a.week || a.rank - b.rank || a.label.localeCompare(b.label));
}
