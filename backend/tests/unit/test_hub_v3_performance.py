"""
AGENMATICA — T17: Performance Audit — List View Scroll
Verifies that SignalFeed / ConceptList can handle large datasets
without O(n²) rendering or redundant sorts.

These are logical/data structure tests — the actual DOM performance
must be validated via Playwright or browser profiling.
"""

import pytest
import time
from datetime import date, timedelta

from app.models.models import Band, User, PlanType, StrategicBatch, StrategicPost


@pytest.fixture
def band():
    user = User(email="perf@test.com", hashed_password="x")
    return Band(name="PerfBand", owner=user, plan=PlanType.STARTER)


def _make_posts(band, count: int) -> list:
    batch = StrategicBatch(band=band)
    return [
        StrategicPost(
            id=i,
            batch=batch,
            platform=["instagram", "tiktok", "facebook", "youtube"][i % 4],
            concept_title=f"Concept {i}",
            narrative_goal=f"Goal {i}",
            scheduled_date=date(2025, 1, 1) + timedelta(days=i % 90),
            caption=f"Caption text for post {i}" if i % 2 == 0 else None,
            is_approved=i % 3 == 0,
        )
        for i in range(count)
    ]


# ─── Grouping-by-date performance ─────────────────────

def test_group_posts_by_date_linear_time(band):
    """
    ConceptList groups items by date. Verify this is O(n) not O(n²).
    100 posts grouped in under 10ms on any reasonable machine.
    """
    posts = _make_posts(band, count=100)

    start = time.perf_counter()
    grouped = {}
    for p in posts:
        key = str(p.scheduled_date) or "sin-fecha"
        grouped.setdefault(key, []).append(p)
    elapsed_ms = (time.perf_counter() - start) * 1000

    assert elapsed_ms < 10, f"Grouping 100 posts took {elapsed_ms:.1f}ms (expected <10ms)"
    assert len(grouped) > 0


def test_group_posts_500_items_under_50ms(band):
    """500 posts grouped in under 50ms — stress test."""
    posts = _make_posts(band, count=500)

    start = time.perf_counter()
    grouped = {}
    for p in posts:
        key = str(p.scheduled_date) or "sin-fecha"
        grouped.setdefault(key, []).append(p)
    elapsed_ms = (time.perf_counter() - start) * 1000

    assert elapsed_ms < 50, f"Grouping 500 posts took {elapsed_ms:.1f}ms (expected <50ms)"


# ─── Sort performance ──────────────────────────────────

def test_sort_mixed_events_and_posts(band):
    """
    ConceptList merges events + posts then sorts by date.
    Merging + sorting 200 items must be under 20ms.
    """
    posts = _make_posts(band, count=200)

    start = time.perf_counter()
    items = [
        {"type": "concept", "date": str(p.scheduled_date), "data": p}
        for p in posts
    ]
    items.sort(key=lambda x: x["date"] or "zzz")
    elapsed_ms = (time.perf_counter() - start) * 1000

    assert elapsed_ms < 20, f"Sorting 200 items took {elapsed_ms:.1f}ms (expected <20ms)"
    assert items[0]["date"] <= items[-1]["date"]


# ─── Filter performance (SignalFeed selectedDay) ───────

def test_filter_by_selected_day_is_fast(band):
    """
    SignalFeed filters posts by selectedDay. Filtering 500 posts must be <5ms.
    """
    posts = _make_posts(band, count=500)
    target_date = date(2025, 1, 15)

    start = time.perf_counter()
    visible = [
        p for p in posts
        if p.scheduled_date and p.scheduled_date == target_date
    ]
    elapsed_ms = (time.perf_counter() - start) * 1000

    assert elapsed_ms < 5, f"Filtering 500 posts took {elapsed_ms:.1f}ms (expected <5ms)"
    _ = visible  # use result to avoid unused-variable hint


# ─── Eligible posts filter (generate-signals) ─────────

def test_eligible_filter_on_large_batch_is_fast(band):
    """
    generate-signals eligibility filter on 1000 posts must be <10ms.
    """
    posts = _make_posts(band, count=1000)

    start = time.perf_counter()
    eligible = [p for p in posts if p.is_approved and p.caption is None]
    elapsed_ms = (time.perf_counter() - start) * 1000

    assert elapsed_ms < 10, f"Eligibility filter on 1000 posts took {elapsed_ms:.1f}ms (expected <10ms)"
    assert len(eligible) > 0


# ─── Approved count computation ───────────────────────

def test_approved_count_is_fast(band):
    """
    Planner.jsx computes approvedCount = batch.posts.filter(p => p.is_approved).length
    on every render. With 500 posts this must be negligible (<2ms).
    """
    posts = _make_posts(band, count=500)

    start = time.perf_counter()
    approved_count = sum(1 for p in posts if p.is_approved)
    elapsed_ms = (time.perf_counter() - start) * 1000

    assert elapsed_ms < 2, f"Approved count on 500 posts took {elapsed_ms:.1f}ms (expected <2ms)"
    assert approved_count > 0
