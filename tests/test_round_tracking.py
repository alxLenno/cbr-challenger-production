import os
import tempfile
import unittest


class RoundTrackingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        database_path = os.path.join(cls.temp_dir.name, "round-tracking.db")
        os.environ["DATABASE_URL"] = f"sqlite:///{database_path}"
        os.environ["SECRET_KEY"] = "round-tracking-test"

        from app import app
        from models import ArchivedCard, CardState, User, db

        cls.app = app
        cls.db = db
        cls.User = User
        cls.CardState = CardState
        cls.ArchivedCard = ArchivedCard
        cls.app.config.update(TESTING=True)

        with cls.app.app_context():
            cls.user = User(
                google_id="round-test-user",
                email="round@example.test",
                name="Round Tester",
            )
            db.session.add(cls.user)
            db.session.commit()
            cls.user_id = cls.user.id

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            cls.db.session.remove()
            cls.db.engine.dispose()
        cls.temp_dir.cleanup()

    def setUp(self):
        self.client = self.app.test_client()
        with self.client.session_transaction() as session:
            session["_user_id"] = str(self.user_id)
            session["_fresh"] = True

    @staticmethod
    def make_state(card_id, round_num, instance_id, commencing_date, note):
        return {
            "username": "Round Tester",
            "currentCardId": card_id,
            "round": round_num,
            "activeInstanceId": instance_id,
            "commencingDate": commencing_date,
            "theme": "dark",
            "contact": "",
            "church": "",
            "peg": "",
            "cohort": "",
            "weaknesses": [{"name": "", "action": ""}] * 3,
            "days": [{
                "dayNumber": 1,
                "wakingTime": "",
                "morningChapters": 0,
                "laterChapters": 0,
                "studyMethod": "FID",
                "fidFocus": note,
            }],
            "weeks": [{"weekNumber": 1, "sharedFid": False}],
            "savedCards": [{
                "instanceId": instance_id,
                "currentCardId": card_id,
                "cardId": card_id,
                "round": round_num,
                "commencingDate": commencing_date,
                "username": "Round Tester",
                "weaknesses": [{"name": "", "action": ""}] * 3,
                "days": [{
                    "dayNumber": 1,
                    "wakingTime": "",
                    "morningChapters": 0,
                    "laterChapters": 0,
                    "studyMethod": "FID",
                    "fidFocus": note,
                }],
                "weeks": [{"weekNumber": 1, "sharedFid": False}],
                "totalScore": 0,
                "totalLaxity": 0,
                "savedAt": "2026-08-17T10:00:00",
            }],
        }

    def test_round_2_card_1_does_not_collide_with_round_1_card_1(self):
        round1_card1_id = "card_1_round1"
        round1_card1 = self.make_state(1, 1, round1_card1_id, "2026-06-08", "Round 1 Card 1 note")
        response = self.client.post("/api/save_state", json=round1_card1)
        self.assertEqual(response.status_code, 200)

        round2_card1_id = "card_1_round2"
        round2_card1 = self.make_state(1, 2, round2_card1_id, "2026-09-07", "Round 2 Card 1 note")
        round2_card1["savedCards"] = round1_card1["savedCards"] + round2_card1["savedCards"]
        response = self.client.post("/api/save_state", json=round2_card1)
        self.assertEqual(response.status_code, 200)

        state = self.client.get("/api/state").get_json()

        # The live/active board must reflect round 2's data, not round 1's.
        self.assertEqual(state["currentCardId"], 1)
        self.assertEqual(state["round"], 2)
        self.assertEqual(state["activeInstanceId"], round2_card1_id)
        self.assertEqual(state["days"][0]["fidFocus"], "Round 2 Card 1 note")

        # Both instances must be independently archived and tagged with their round.
        snapshots = {card["instanceId"]: card for card in state["savedCards"]}
        self.assertEqual(len(snapshots), 2)
        self.assertEqual(snapshots[round1_card1_id]["round"], 1)
        self.assertEqual(snapshots[round1_card1_id]["days"][0]["fidFocus"], "Round 1 Card 1 note")
        self.assertEqual(snapshots[round2_card1_id]["round"], 2)
        self.assertEqual(snapshots[round2_card1_id]["days"][0]["fidFocus"], "Round 2 Card 1 note")

        with self.app.app_context():
            card_state = self.CardState.query.filter_by(user_id=self.user_id).order_by(
                self.CardState.id.desc()
            ).first()
            self.assertEqual(card_state.round, 2)

            archived_round1 = self.ArchivedCard.query.filter_by(
                user_id=self.user_id, instance_id=round1_card1_id
            ).first()
            archived_round2 = self.ArchivedCard.query.filter_by(
                user_id=self.user_id, instance_id=round2_card1_id
            ).first()
            self.assertEqual(archived_round1.round, 1)
            self.assertEqual(archived_round2.round, 2)


if __name__ == "__main__":
    unittest.main()
