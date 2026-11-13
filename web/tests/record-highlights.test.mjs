import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { recordHighlights } from '../src/lib/record-highlights.ts';

function fixture() {
  const records = JSON.parse(fs.readFileSync(new URL('../../data/records.json', import.meta.url)));
  const players = JSON.parse(fs.readFileSync(new URL('../../data/players.json', import.meta.url)));
  for (const key of Object.keys(records)) if (Array.isArray(records[key])) records[key] = [];
  for (const set of Object.values(records.game_records)) for (const key of Object.keys(set)) set[key] = [];
  players.all_time_top_by_position = {};
  players.biggest_bench_scores = players.biggest_carry_jobs = players.opening_week_top = [];
  players.regular_season_records.top_by_position = {};
  for (const key of ['most_bench_points', 'lowest_starting_points', 'best_starter_ppg', 'worst_starter_ppg']) players.regular_season_records[key] = [];
  return { records, players };
}
const game = (year, week, score) => ({ year, week, score, owners: ['Ben'], team: 'Team', opp_owners: ['Rival'] });

test('newest records first, independent of medal rank; only current-year top three', () => {
  const { records, players } = fixture();
  records.game_records.regular_season.highest_scores = [game(2026, 1, 200), game(2025, 10, 190), game(2026, 9, 180), game(2026, 10, 170)];
  const result = recordHighlights(records, players, 2026, 14, false);
  assert.deepEqual(result.map(r => [r.week, r.rank]), [[9, 3], [1, 1]]);
  assert.equal(result[0].href, '/records#single-week');
});

test('partial season totals do not become season records prematurely', () => {
  const { records, players } = fixture();
  records.lowest_season_pf = [{ year: 2026, points_for: 100, owner_names: ['Ben'], team: 'Team' }];
  assert.equal(recordHighlights(records, players, 2026, 14, false).length, 0);
  assert.equal(recordHighlights(records, players, 2026, 14, true)[0].week, 14);
});

test('more than five highlights remain available, sorted newest first', () => {
  const { records, players } = fixture();
  for (const key of ['highest_scores', 'lowest_scores', 'highest_losing_scores']) {
    records.game_records.regular_season[key] = [game(2026, 3, 150), game(2026, 5, 140), game(2026, 8, 130)];
  }
  const result = recordHighlights(records, players, 2026, 14, false);
  assert.equal(result.length, 9);
  assert.deepEqual(result.map(r => r.week), [8, 8, 8, 5, 5, 5, 3, 3, 3]);
  assert.equal(new Set(result.map(r => r.id)).size, 9);
});

test('empty season returns no highlights', () => {
  const { records, players } = fixture();
  assert.deepEqual(recordHighlights(records, players, 2026, 0, false), []);
});

test('cumulative season highs can qualify before the season ends', () => {
  const { records, players } = fixture();
  records.highest_season_pf = [{ year: 2026, points_for: 2000, owner_names: ['Ben'], team: 'Team' }];
  const result = recordHighlights(records, players, 2026, 12, false);
  assert.equal(result.length, 1);
  assert.equal(result[0].week, 12);
  assert.equal(result[0].value, 2000);
});

test('streak records use the ending week for newest-first sorting', () => {
  const { records, players } = fixture();
  records.streaks = [{ owner_id: 'ben', display_name: 'Ben', longest_win_streak: 8, longest_loss_streak: 0, win_streak_range: [[2025, 16], [2026, 7]], loss_streak_range: null }];
  const result = recordHighlights(records, players, 2026, 7, false);
  assert.equal(result.length, 1);
  assert.equal(result[0].week, 7);
  assert.equal(result[0].href, '/records#seasons');
});
