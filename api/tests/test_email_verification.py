from datetime import timedelta

import pytest
from sqlalchemy import create_engine, text

from app import verification
from app.migrate import add_missing_columns
from app.models import EmailCode, User


@pytest.fixture
def outbox(monkeypatch):
    sent = []
    monkeypatch.setattr(verification, "send_email", lambda to, name, subject, body: sent.append((to, subject, body)))
    return sent


def code_from(outbox):
    return outbox[-1][1].split()[0]


def register(client, email="sam@example.com"):
    r = client.post("/auth/register", json={"name": "Sam", "email": email, "password": "hunter22"})
    assert r.status_code == 200, r.text
    return r.json(), {"Authorization": f"Bearer {r.json()['token']}"}


def test_sign_up_emails_a_six_digit_code_and_starts_unverified(client, outbox, db):
    body, _ = register(client)
    assert body["me"]["emailVerified"] is False
    assert len(outbox) == 1 and outbox[0][0] == "sam@example.com"
    code = code_from(outbox)
    assert len(code) == 6 and code.isdigit() and code in outbox[0][2]
    row = db.query(EmailCode).one()
    assert code not in row.code_hash  # only a hash is stored


def test_the_right_code_verifies_the_email(client, outbox):
    _, headers = register(client)
    r = client.post("/auth/verify-email", headers=headers, json={"code": code_from(outbox)})
    assert r.status_code == 200 and r.json()["emailVerified"] is True
    assert client.get("/me", headers=headers).json()["emailVerified"] is True
    login = client.post("/auth/login", json={"email": "sam@example.com", "password": "hunter22"})
    assert login.json()["me"]["emailVerified"] is True


def test_a_wrong_code_is_refused_and_tries_run_out(client, outbox):
    _, headers = register(client)
    right = code_from(outbox)
    wrong = "000000" if right != "000000" else "111111"
    for _ in range(verification.MAX_ATTEMPTS):
        assert client.post("/auth/verify-email", headers=headers, json={"code": wrong}).status_code == 400
    r = client.post("/auth/verify-email", headers=headers, json={"code": right})
    assert r.status_code == 429  # even the right code, once the tries are used up


def test_an_expired_code_is_refused(client, outbox, db):
    _, headers = register(client)
    row = db.query(EmailCode).one()
    row.expires_at = row.expires_at - timedelta(minutes=verification.CODE_MINUTES + 1)
    db.commit()
    assert client.post("/auth/verify-email", headers=headers, json={"code": code_from(outbox)}).status_code == 400


def test_resend_replaces_the_code_after_a_short_wait(client, outbox, db):
    _, headers = register(client)
    first = code_from(outbox)
    assert client.post("/auth/resend-code", headers=headers).status_code == 429  # too soon
    row = db.query(EmailCode).one()
    row.sent_at = row.sent_at - timedelta(seconds=verification.RESEND_SECONDS + 1)
    db.commit()
    assert client.post("/auth/resend-code", headers=headers).status_code == 204
    second = code_from(outbox)
    if first != second:
        assert client.post("/auth/verify-email", headers=headers, json={"code": first}).status_code == 400
    assert client.post("/auth/verify-email", headers=headers, json={"code": second}).status_code == 200
    assert client.post("/auth/resend-code", headers=headers).status_code == 409  # already verified


def test_codes_must_be_six_digits(client, outbox):
    _, headers = register(client)
    assert client.post("/auth/verify-email", headers=headers, json={"code": "12ab56"}).status_code == 422


def test_accounts_made_before_verification_existed_count_as_verified(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'old.db'}")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE users (id VARCHAR(32) PRIMARY KEY, name VARCHAR(80), email VARCHAR(255), "
                          "password_hash VARCHAR(255), created_at TIMESTAMP)"))
        conn.execute(text("INSERT INTO users VALUES ('a1', 'Old', 'old@example.com', 'x', '2026-01-01 00:00:00')"))
    assert "users.email_verified_at" in add_missing_columns(engine)
    with engine.begin() as conn:
        assert conn.execute(text("SELECT email_verified_at FROM users")).scalar() is not None


def test_sign_up_still_works_when_the_email_cannot_be_sent(client, monkeypatch):
    from app.logic import DomainError

    def broken(*args, **kwargs):
        raise DomainError("We couldn't send the email. Try again in a minute.", status=502)

    monkeypatch.setattr(verification, "send_email", broken)
    body, _ = register(client)
    assert body["me"]["emailVerified"] is False and body["token"]
