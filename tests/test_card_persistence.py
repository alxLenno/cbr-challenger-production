import os
import tempfile
import unittest


class CardPersistenceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        database_path = os.path.join(cls.temp_dir.name, "card-persistence.db")
        os.environ["DATABASE_URL"] = f"sqlite:///{database_path}"
        os.environ["SECRET_KEY"] = "card-persistence-test"

        from app import app
        from models import ArchivedCard, User, db

        cls.app = app
        cls.db = db
        cls.User = User
        cls.ArchivedCard = ArchivedCard
        cls.app.config.update(TESTING=True)

        with cls.app.app_context():
            cls.user = User(
                google_id="persistence-test-user",
                email="persistence@example.test",
                name="Persistence Tester",
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
    def make_state(card_id, instance_id, note):
        return {
            "username": "Persistence Tester",
            "currentCardId": card_id,
            "activeInstanceId": instance_id,
            "commencingDate": "2026-08-03",
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
                "commencingDate": "2026-08-03",
                "username": "Persistence Tester",
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

    def test_partial_progress_survives_switch_and_restore(self):
        card_one_id = "card_1_partial-progress"
        card_two_id = "card_2_partial-progress"

        first_save = self.make_state(1, card_one_id, "First partial note")
        response = self.client.post("/api/save_state", json=first_save)
        self.assertEqual(response.status_code, 200)

        first_save["days"][0]["fidFocus"] = "Updated partial note"
        first_save["savedCards"][0]["days"][0]["fidFocus"] = "Updated partial note"
        response = self.client.post("/api/save_state", json=first_save)
        self.assertEqual(response.status_code, 200)

        with self.app.app_context():
            matching = self.ArchivedCard.query.filter_by(
                user_id=self.user_id,
                instance_id=card_one_id,
            ).all()
            self.assertEqual(len(matching), 1)
            self.assertEqual(
                matching[0].snapshot_data["days"][0]["fidFocus"],
                "Updated partial note",
            )

        card_two = self.make_state(2, card_two_id, "Card two partial note")
        card_two["savedCards"] = first_save["savedCards"] + card_two["savedCards"]
        response = self.client.post("/api/save_state", json=card_two)
        self.assertEqual(response.status_code, 200)

        state = self.client.get("/api/state").get_json()
        snapshots = {card["instanceId"]: card for card in state["savedCards"]}
        self.assertEqual(state["activeInstanceId"], card_two_id)
        self.assertEqual(
            snapshots[card_one_id]["days"][0]["fidFocus"],
            "Updated partial note",
        )
        self.assertEqual(
            snapshots[card_two_id]["days"][0]["fidFocus"],
            "Card two partial note",
        )

        restored = dict(snapshots[card_one_id])
        restored["activeInstanceId"] = card_one_id
        restored["savedCards"] = list(snapshots.values())
        response = self.client.post("/api/save_state", json=restored)
        self.assertEqual(response.status_code, 200)

        restored_state = self.client.get("/api/state").get_json()
        self.assertEqual(restored_state["currentCardId"], 1)
        self.assertEqual(restored_state["activeInstanceId"], card_one_id)
        self.assertEqual(
            restored_state["days"][0]["fidFocus"],
            "Updated partial note",
        )


if __name__ == "__main__":
    unittest.main()
