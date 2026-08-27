import os
from pathlib import Path
import subprocess
import sys

from sqlalchemy import create_engine, inspect, text


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ALEMBIC_HEAD = "20260827_08"
EXPECTED_TABLES = {
    "alembic_version",
    "draw_audits",
    "financial_ledger",
    "orders",
    "payment_events",
    "raffles",
    "tenants",
    "tickets",
    "users",
    "withdrawal_requests",
}


def run_alembic(database_url: str, *args: str) -> subprocess.CompletedProcess[str]:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url
    return subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=PROJECT_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )


def test_migrations_build_current_schema_from_empty_database(tmp_path):
    database_path = tmp_path / "migration-test.db"
    database_url = f"sqlite:///{database_path.as_posix()}"

    upgrade = run_alembic(database_url, "upgrade", "head")
    assert upgrade.returncode == 0, upgrade.stdout + upgrade.stderr

    engine = create_engine(database_url)
    try:
        inspector = inspect(engine)
        assert set(inspector.get_table_names()) == EXPECTED_TABLES
        with engine.connect() as connection:
            revision = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        assert revision == ALEMBIC_HEAD
    finally:
        engine.dispose()

    schema_check = run_alembic(database_url, "check")
    assert schema_check.returncode == 0, schema_check.stdout + schema_check.stderr
    assert "No new upgrade operations detected" in schema_check.stdout + schema_check.stderr
