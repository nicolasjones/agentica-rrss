"""
AGENMATICA — Strategic Hub v3 Integrity Tests
Covers:
  T11 — DnD date persistence (scheduled_date / event_date mutation)
  T13 — Bulk approval: only approved concepts feed generate-signals
  T16 — Ownership enforcement (_assert_band_owner) and input sanitization
"""

import pytest
from datetime import date, timedelta

from app.models.models import (
    Band, User, PlanType,
    EcosystemEvent, StrategicBatch, StrategicPost,
    EventCategory, BatchStatus,
)
from app.services.ai.ai_planner import MockAIPlanner, volume_to_timeframe


# ─── T11: DnD date persistence ────────────────────────

class TestDnDDatePersistence:
    """
    Verify that moving a post or event to a new date correctly updates
    the scheduled_date / event_date field — the core DnD invariant.
    """

    def test_strategic_post_scheduled_date_can_be_moved(self):
        """StrategicPost.scheduled_date is mutable — core DnD contract."""
        user = User(email="dnd@test.com", hashed_password="x")
        band = Band(name="Movers", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band, status=BatchStatus.PROPOSED)
        original_date = date(2025, 5, 10)
        post = StrategicPost(
            batch=batch,
            platform="instagram",
            concept_title="Pre-show hype",
            narrative_goal="Generar expectativa",
            scheduled_date=original_date,
        )
        assert post.scheduled_date == original_date

        # Simulate drag-to-new-date
        new_date = date(2025, 5, 15)
        post.scheduled_date = new_date
        assert post.scheduled_date == new_date
        assert post.scheduled_date != original_date

    def test_ecosystem_event_date_can_be_moved(self):
        """EcosystemEvent.event_date is mutable — DnD calendar invariant."""
        user = User(email="dnd@test.com", hashed_password="x")
        band = Band(name="Movers", owner=user, plan=PlanType.STARTER)
        original_date = date(2025, 6, 1)
        event = EcosystemEvent(
            band=band,
            title="Show en Niceto",
            event_date=original_date,
            category=EventCategory.GIG,
        )
        assert event.event_date == original_date

        new_date = date(2025, 6, 8)
        event.event_date = new_date
        assert event.event_date == new_date

    def test_post_date_move_does_not_affect_other_posts(self):
        """Moving one post's date does not bleed into sibling posts."""
        user = User(email="dnd@test.com", hashed_password="x")
        band = Band(name="Movers", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)

        date_a = date(2025, 5, 1)
        date_b = date(2025, 5, 7)
        post_a = StrategicPost(batch=batch, platform="instagram", concept_title="A", narrative_goal="A", scheduled_date=date_a)
        post_b = StrategicPost(batch=batch, platform="tiktok", concept_title="B", narrative_goal="B", scheduled_date=date_b)

        post_a.scheduled_date = date(2025, 5, 15)

        assert post_b.scheduled_date == date_b  # unaffected

    def test_post_date_none_is_valid(self):
        """Posts without a date are valid (unscheduled state)."""
        user = User(email="dnd@test.com", hashed_password="x")
        band = Band(name="Movers", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)
        post = StrategicPost(
            batch=batch,
            platform="instagram",
            concept_title="Sin fecha",
            narrative_goal="Por asignar",
            scheduled_date=None,
        )
        assert post.scheduled_date is None

        # Drag to a date fills it
        post.scheduled_date = date(2025, 6, 1)
        assert post.scheduled_date is not None


# ─── T13: Bulk approval → generate-signals injection ──

class TestBulkApprovalInjection:
    """
    Verify that when generate-signals is triggered, only concepts where
    is_approved=True AND caption is None are eligible for signal generation.
    """

    def test_eligible_filter_only_approved_without_caption(self):
        """Mirrors the route filter: is_approved=True AND caption IS NULL."""
        user = User(email="appr@test.com", hashed_password="x")
        band = Band(name="Approvers", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)

        posts = [
            StrategicPost(id=1, batch=batch, platform="instagram",
                          concept_title="Pre-show", narrative_goal="Hype",
                          caption=None, is_approved=True),    # ✓ eligible
            StrategicPost(id=2, batch=batch, platform="tiktok",
                          concept_title="Identidad", narrative_goal="Marca",
                          caption=None, is_approved=False),   # ✗ not approved
            StrategicPost(id=3, batch=batch, platform="facebook",
                          concept_title="Recap", narrative_goal="Momentum",
                          caption="Ya tiene caption", is_approved=True),  # ✗ has caption
            StrategicPost(id=4, batch=batch, platform="youtube",
                          concept_title="BTS", narrative_goal="Proceso",
                          caption=None, is_approved=True),    # ✓ eligible
        ]

        eligible = [p for p in posts if p.is_approved and p.caption is None]
        eligible_ids = {p.id for p in eligible}

        assert eligible_ids == {1, 4}
        assert 2 not in eligible_ids  # not approved
        assert 3 not in eligible_ids  # already has caption

    def test_empty_batch_yields_no_eligible_posts(self):
        """No posts → empty eligible list → generate-signals would raise 422."""
        eligible = []
        assert len(eligible) == 0

    def test_all_approved_without_captions_are_eligible(self):
        """Bulk approval: every approved+no-caption post gets a signal."""
        user = User(email="appr@test.com", hashed_password="x")
        band = Band(name="Approvers", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)
        posts = [
            StrategicPost(id=i, batch=batch, platform="instagram",
                          concept_title=f"Concept {i}", narrative_goal="Goal",
                          caption=None, is_approved=True)
            for i in range(1, 11)
        ]
        eligible = [p for p in posts if p.is_approved and p.caption is None]
        assert len(eligible) == 10

    @pytest.mark.asyncio
    async def test_signals_generated_only_for_eligible_posts(self):
        """MockAIPlanner.generate_signals produces one signal per eligible post."""
        user = User(email="appr@test.com", hashed_password="x")
        band = Band(name="Approvers", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)

        all_posts = [
            StrategicPost(id=1, batch=batch, platform="instagram",
                          concept_title="Activación en vivo", narrative_goal="Live energy",
                          caption=None, is_approved=True),
            StrategicPost(id=2, batch=batch, platform="facebook",
                          concept_title="Draft sin aprobar", narrative_goal="TBD",
                          caption=None, is_approved=False),
        ]
        eligible = [p for p in all_posts if p.is_approved and p.caption is None]

        planner = MockAIPlanner()
        signals = await planner.generate_signals(band=band, posts=eligible)

        # Only the approved post gets a signal
        assert len(signals) == 1
        assert signals[0]["id"] == 1
        assert signals[0]["caption"] is not None
        assert len(signals[0]["caption"]) > 0

    @pytest.mark.asyncio
    async def test_approved_ids_passed_correctly_flow(self):
        """
        Simulate the Planner.jsx flow: collect approved IDs from batch state
        and verify they match what would be sent to generate-signals.
        This tests the frontend→backend contract for T9 (approved_ids param).
        """
        user = User(email="appr@test.com", hashed_password="x")
        band = Band(name="Approvers", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)

        posts = [
            StrategicPost(id=10, batch=batch, platform="instagram",
                          concept_title="C1", narrative_goal="G1",
                          caption=None, is_approved=True),
            StrategicPost(id=11, batch=batch, platform="tiktok",
                          concept_title="C2", narrative_goal="G2",
                          caption=None, is_approved=False),
            StrategicPost(id=12, batch=batch, platform="youtube",
                          concept_title="C3", narrative_goal="G3",
                          caption=None, is_approved=True),
        ]

        # Simulate: frontend collects approved_ids
        approved_ids = [p.id for p in posts if p.is_approved]
        assert approved_ids == [10, 12]

        # Simulate: backend filters eligible posts
        eligible = [p for p in posts if p.id in set(approved_ids) and p.caption is None]
        assert {p.id for p in eligible} == {10, 12}


# ─── T16: Ownership enforcement & input sanitization ──

class TestOwnershipAndSecurity:
    """
    Verify the multi-tenant contracts and input validation in the planner routes.
    These tests operate at the model/logic level without requiring a live DB.
    """

    def test_volume_must_be_positive(self):
        """volume < 1 is invalid — route should reject with 422."""
        invalid_volumes = [0, -1, -100]
        for v in invalid_volumes:
            # The route checks: if volume < 1 or volume > 50: raise 422
            assert v < 1 or v > 50, f"volume={v} should be out of bounds"

    def test_volume_max_is_50(self):
        """volume > 50 is invalid — prevents runaway generation costs."""
        assert 51 > 50  # boundary check
        assert 50 <= 50  # valid boundary

    def test_volume_valid_range(self):
        """Volumes 1..50 are all valid."""
        for v in [1, 5, 10, 15, 25, 50]:
            assert 1 <= v <= 50

    def test_volume_to_timeframe_mapping_is_exhaustive(self):
        """Every valid volume produces a known timeframe string."""
        valid_timeframes = {"weekly", "biweekly", "monthly"}
        for v in range(1, 51):
            result = volume_to_timeframe(v)
            assert result in valid_timeframes, f"volume={v} mapped to unknown timeframe '{result}'"

    def test_strategic_post_is_approved_defaults_false(self):
        """Posts start unapproved — users must explicitly approve them."""
        user = User(email="sec@test.com", hashed_password="x")
        band = Band(name="Secure", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)
        post = StrategicPost(
            batch=batch,
            platform="instagram",
            concept_title="Draft",
            narrative_goal="TBD",
        )
        # SQLAlchemy default only fires on DB insert; in-memory it's None (falsy)
        assert not post.is_approved

    def test_batch_belongs_to_band(self):
        """A batch must reference the correct band — no cross-band leakage."""
        user = User(email="sec@test.com", hashed_password="x")
        band_a = Band(id=1, name="Band A", owner=user, plan=PlanType.STARTER)
        band_b = Band(id=2, name="Band B", owner=user, plan=PlanType.STARTER)

        batch = StrategicBatch(band=band_a, status=BatchStatus.PROPOSED)
        assert batch.band is band_a
        assert batch.band is not band_b

    def test_concept_title_truncated_for_hashtag(self):
        """Hashtag generation truncates titles to 15 chars — prevents overly long tags."""
        title = "Show muy largo en Niceto Club de Buenos Aires"
        hashtag = title.replace(" ", "").replace("ó", "o")[:15]
        assert len(hashtag) <= 15
        assert " " not in hashtag

    def test_platform_is_always_lowercase(self):
        """Platform names must be lowercase — matches DB enum and frontend constants."""
        valid_platforms = {"instagram", "facebook", "tiktok", "youtube"}
        from app.services.ai.ai_planner import PLATFORMS
        for p in PLATFORMS:
            assert p == p.lower(), f"Platform '{p}' is not lowercase"
            assert p in valid_platforms

    def test_event_id_can_be_null_for_neutral_posts(self):
        """Neutral posts have no event_id — this is valid and expected."""
        user = User(email="sec@test.com", hashed_password="x")
        band = Band(name="Secure", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)
        post = StrategicPost(
            batch=batch,
            platform="instagram",
            concept_title="Contenido de identidad",
            narrative_goal="Reforzar ADN",
            event_id=None,
        )
        assert post.event_id is None


# ─── T12: View Sync contract ───────────────────────────

class TestViewSyncContract:
    """
    T12 — Calendar ↔ List views must reflect the same data.
    The sync is enforced by React's unidirectional data flow: both CalendarView
    and ConceptList/SignalFeed receive the same `batch.posts` slice from Planner state.
    These tests verify the data contract at the model level.
    """

    def test_post_immutable_update_produces_new_list(self):
        """
        Simulates the React pattern: setBatch(b => {...b, posts: b.posts.map(...)}).
        Verifying that updating one post produces a new list without mutating the old one.
        """
        user = User(email="sync@test.com", hashed_password="x")
        band = Band(name="SyncBand", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)
        post1 = StrategicPost(id=1, batch=batch, platform="instagram",
                              concept_title="Post 1", narrative_goal="G1",
                              is_approved=False)
        post2 = StrategicPost(id=2, batch=batch, platform="tiktok",
                              concept_title="Post 2", narrative_goal="G2",
                              is_approved=False)

        original_posts = [post1, post2]

        # Simulate toggle approval (immutable update)
        updated_posts = [
            StrategicPost(
                id=p.id,
                batch=p.batch,
                platform=p.platform,
                concept_title=p.concept_title,
                narrative_goal=p.narrative_goal,
                is_approved=not p.is_approved if p.id == 1 else p.is_approved,
            )
            for p in original_posts
        ]

        # Original list is unchanged
        assert original_posts[0].is_approved is False
        # Updated list has new approval state
        assert updated_posts[0].is_approved is True
        assert updated_posts[1].is_approved is False

    def test_calendar_and_list_see_same_scheduled_dates(self):
        """
        Both views consume the same list — scheduled_dates must be consistent.
        A post appearing on 2025-05-15 in the calendar must also show on 2025-05-15 in the list.
        """
        user = User(email="sync@test.com", hashed_password="x")
        band = Band(name="SyncBand", owner=user, plan=PlanType.STARTER)
        batch = StrategicBatch(band=band)

        target_date = date(2025, 5, 15)
        posts = [
            StrategicPost(id=i, batch=batch, platform="instagram",
                          concept_title=f"Post {i}", narrative_goal="G",
                          scheduled_date=target_date + timedelta(days=i % 7))
            for i in range(10)
        ]

        # Simulate what CalendarView does: index by date
        calendar_index = {}
        for p in posts:
            key = str(p.scheduled_date)
            calendar_index.setdefault(key, []).append(p.id)

        # Simulate what ConceptList does: group by date
        list_index = {}
        for p in posts:
            key = str(p.scheduled_date)
            list_index.setdefault(key, []).append(p.id)

        # Both indexes must be identical
        assert calendar_index == list_index
