"""Iris chat abuse limits: run with python -m unittest discover -s tests -p test_iris_chat.py."""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.pop("OPENAI_API_KEY", None)  # never call the real model from tests
import server


class IrisChatTests(unittest.TestCase):
    def setUp(self):
        server.sessions.clear()
        server._chat_hits.clear()
        server._global_hits.clear()
        self.client = server.app.test_client()

    def post(self, message, ip="203.0.113.7", **extra):
        return self.client.post("/api/chat/message", json={"message": message, **extra},
                                environ_overrides={"REMOTE_ADDR": ip})

    def test_normal_message_gets_a_reply(self):
        response = self.post("who are you")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Iris", response.get_json()["response"])

    def test_overlong_message_is_refused_without_a_model_call(self):
        with patch.object(server, "_generate_response") as generate:
            response = self.post("x" * (server.MAX_MESSAGE_CHARS + 1))
        self.assertEqual(response.status_code, 413)
        self.assertTrue(response.get_json()["response"])
        generate.assert_not_called()

    def test_per_client_rate_limit(self):
        limit = server.CHAT_LIMITS[0][1]
        for _ in range(limit):
            self.assertEqual(self.post("hello").status_code, 200)
        blocked = self.post("hello")
        self.assertEqual(blocked.status_code, 429)
        self.assertTrue(blocked.get_json()["response"])
        # Another visitor is unaffected.
        self.assertEqual(self.post("hello", ip="198.51.100.9").status_code, 200)

    def test_rate_limit_window_slides(self):
        window, limit = server.CHAT_LIMITS[0]
        for _ in range(limit):
            self.assertFalse(server._rate_limited("a", now=1000.0))
        self.assertTrue(server._rate_limited("a", now=1000.0))
        self.assertFalse(server._rate_limited("a", now=1000.0 + window + 1))

    def test_global_daily_ceiling(self):
        with patch.object(server, "CHAT_GLOBAL_DAILY_LIMIT", 3):
            for n in range(3):
                self.assertFalse(server._rate_limited(f"client-{n}", now=50.0))
            self.assertTrue(server._rate_limited("fresh-client", now=50.0))

    def test_sessions_are_bounded(self):
        with patch.object(server, "MAX_SESSIONS", 5), patch.object(server, "CHAT_LIMITS", ((60, 10_000),)):
            for n in range(20):
                self.post("hi", sessionId=f"s{n}")
        self.assertLessEqual(len(server.sessions), 5)
        self.assertIn("s19", server.sessions)

    def test_security_headers(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response.headers["X-Frame-Options"], "SAMEORIGIN")
        self.assertIn("max-age", response.headers["Strict-Transport-Security"])

    def test_oversized_body_rejected(self):
        response = self.client.post("/api/chat/message", data="x" * 400_000,
                                    content_type="application/json")
        self.assertEqual(response.status_code, 413)


if __name__ == "__main__":
    unittest.main()
