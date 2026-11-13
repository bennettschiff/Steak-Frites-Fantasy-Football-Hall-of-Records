"""Season totals must preserve lineup roles and exclude postseason/future rows."""
import unittest

from pipeline.players import regular_season_records


def make_season(year=2025):
    return {
        "year": year,
        "settings": {"reg_season_count": 7},
        "teams": [
            {"team_id": i, "name": f"Team {i}", "owner_ids": [str(i)], "owner_names": [f"Owner {i}"]}
            for i in (1, 2)
        ],
        "matchups": [
            {"week": w, "home_team_id": 1, "away_team_id": 2,
             "home_score": 100 if w < 9 else 0, "away_score": 90 if w < 9 else 0,
             "is_playoff": w == 8} for w in range(1, 10)
        ],
        "box_scores": {},
    }


def player(points, slot="QB", team=1, pid=1):
    return {"player_id": pid, "player_name": f"Player {pid}", "position": "QB",
            "slot_position": slot, "team_id": team, "points": points, "pro_team": "BUF"}


class SeasonRecordTests(unittest.TestCase):
    def test_roles_transfers_duplicates_and_negative_scores(self):
        season = make_season()
        season["box_scores"] = {
            "1": [player(10), player(10)],
            "2": [player(20, "BE", team=2)],
            "3": [player(-2)],
            "4": [player(100, "IR")],
        }
        result = regular_season_records([season])
        row = result["top_by_position"]["QB"][0]
        self.assertEqual((row["total_points"], row["starting_points"], row["bench_points"]), (28, 8, 20))
        self.assertEqual((row["games_rostered"], row["games_started"], row["games_benched"]), (3, 2, 1))
        self.assertEqual(len(row["fantasy_teams"]), 2)
        self.assertEqual(result["most_bench_points"][0]["games_benched"], 1)
        self.assertEqual(result["lowest_starting_points"], [])

    def test_regular_season_boundary_even_when_playoff_flag_missing(self):
        season = make_season()
        season["matchups"][7]["is_playoff"] = False
        season["box_scores"] = {str(w): [player(w * 10)] for w in (1, 7, 8, 9)}
        row = regular_season_records([season])["top_by_position"]["QB"][0]
        self.assertEqual(row["total_points"], 80)
        self.assertEqual(row["games_rostered"], 2)

    def test_unplayed_and_missing_matchups_do_not_count(self):
        season = make_season()
        season["matchups"][0].update(home_score=0, away_score=0)
        season["matchups"][1]["home_score"] = None
        season["matchups"] = season["matchups"][:2]
        season["box_scores"] = {str(w): [player(50)] for w in (1, 2, 3)}
        self.assertEqual(regular_season_records([season])["top_by_position"]["QB"], [])

    def test_minimum_six_starts_and_separate_seasons(self):
        season = make_season()
        season["box_scores"] = {str(w): [player(10), player(1, pid=2)] for w in range(1, 7)}
        season["box_scores"]["7"] = [player(-20, pid=3)]
        later = make_season(2026)
        later["box_scores"] = {"1": [player(100)]}
        result = regular_season_records([season, later])
        self.assertEqual(len(result["top_by_position"]["QB"]), 4)
        self.assertEqual(result["lowest_starting_points"][0]["player_id"], 2)
        self.assertEqual(result["best_starter_ppg"][0]["ppg_started"], 10)
        self.assertEqual(result["worst_starter_ppg"][0]["ppg_started"], 1)

    def test_sleeper_season_excluded(self):
        season = make_season(2021)
        season["box_scores"] = {"1": [player(1000)]}
        self.assertEqual(regular_season_records([season])["top_by_position"]["QB"], [])


if __name__ == "__main__":
    unittest.main()
