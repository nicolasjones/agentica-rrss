"""
AGENMATICA - Optimal Time Calculator
Determines best posting times using historical engagement data.
Bayesian approach: starts with priors, updates with real data.
"""

import random
from datetime import datetime, timezone, timedelta
from typing import Optional
from collections import defaultdict

from app.core.config import get_settings

settings = get_settings()


# Default priors based on music industry research
# Format: {day_of_week: {hour: engagement_weight}}
DEFAULT_PRIORS = {
    0: {12: 0.5, 18: 0.7, 19: 0.9, 20: 0.8, 21: 0.6},  # Monday
    1: {12: 0.5, 18: 0.7, 19: 0.8, 20: 0.7, 21: 0.5},  # Tuesday
    2: {12: 0.5, 18: 0.7, 19: 0.8, 20: 0.7, 21: 0.5},  # Wednesday
    3: {12: 0.6, 18: 0.8, 19: 0.9, 20: 0.8, 21: 0.6},  # Thursday
    4: {12: 0.6, 17: 0.7, 18: 0.8, 19: 1.0, 20: 0.9, 21: 0.7},  # Friday (peak)
    5: {11: 0.5, 12: 0.6, 17: 0.7, 18: 0.8, 19: 0.9, 20: 0.8},  # Saturday
    6: {11: 0.6, 12: 0.7, 17: 0.6, 18: 0.7, 19: 0.8, 20: 0.7},  # Sunday
}


class OptimalTimeCalculator:
    """
    Calculates optimal posting times for a band.
    
    Strategy:
    1. Start with industry-standard priors (Friday 19:30 is gold)
    2. Overlay band's historical engagement data
    3. Update weekly with new data (Bayesian update)
    4. Return ranked time slots per platform
    """

    def __init__(self):
        self.prior_weight = 0.3  # 30% weight to priors
        self.data_weight = 0.7   # 70% weight to actual data

    def calculate_optimal_times(
        self,
        historical_posts: list[dict],
        platform: str = "instagram",
        timezone_offset: int = -3,  # Argentina (UTC-3)
        num_slots: int = 5,
    ) -> list[dict]:
        """
        Calculate the best times to post.
        
        Args:
            historical_posts: List of {published_at, engagement_data} dicts
            platform: Target platform
            timezone_offset: Hours offset from UTC
            num_slots: Number of time slots to return
            
        Returns:
            List of {day, hour, minute, score, reason} ranked best to worst
        """
        # Build engagement heatmap from historical data
        heatmap = self._build_engagement_heatmap(historical_posts, timezone_offset)

        # Merge with priors
        merged = self._merge_with_priors(heatmap)

        # Rank and return top slots
        ranked_slots = []
        for (day, hour), score in sorted(merged.items(), key=lambda x: x[1], reverse=True):
            if len(ranked_slots) >= num_slots:
                break
            
            # Avoid recommending times too close together
            too_close = any(
                s["day"] == day and abs(s["hour"] - hour) <= 1
                for s in ranked_slots
            )
            if too_close:
                continue

            ranked_slots.append({
                "day": day,
                "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][day],
                "hour": hour,
                "minute": 30 if hour in [19, 20] else 0,  # :30 for prime time
                "score": round(score, 3),
                "reason": self._explain_slot(day, hour, score, heatmap),
            })

        # If not enough data, fill with priors
        if len(ranked_slots) < num_slots:
            ranked_slots.extend(self._get_default_slots(num_slots - len(ranked_slots), ranked_slots))

        return ranked_slots

    def get_next_optimal_time(
        self,
        historical_posts: list[dict],
        platform: str = "instagram",
        timezone_offset: int = -3,
    ) -> datetime:
        """Get the next optimal publishing time from now."""
        slots = self.calculate_optimal_times(historical_posts, platform, timezone_offset)
        now = datetime.now(timezone.utc) + timedelta(hours=timezone_offset)

        for slot in slots:
            # Find next occurrence of this day/hour
            target = self._next_occurrence(now, slot["day"], slot["hour"], slot["minute"])
            if target > now:
                # Convert back to UTC
                return target - timedelta(hours=timezone_offset)

        # Fallback: tomorrow at 19:30 local
        tomorrow = now + timedelta(days=1)
        fallback = tomorrow.replace(hour=19, minute=30, second=0, microsecond=0)
        return fallback - timedelta(hours=timezone_offset)

    def calculate_post_schedule(
        self,
        historical_posts: list[dict],
        posts_per_day: int = 5,
        platform: str = "instagram",
        timezone_offset: int = -3,
    ) -> list[datetime]:
        """
        Calculate a full day's publishing schedule.
        Spreads posts across optimal windows.
        """
        slots = self.calculate_optimal_times(
            historical_posts, platform, timezone_offset, num_slots=posts_per_day * 2
        )

        now = datetime.now(timezone.utc) + timedelta(hours=timezone_offset)
        today = now.date()
        schedule = []

        for slot in slots:
            if len(schedule) >= posts_per_day:
                break

            publish_time = datetime(
                today.year, today.month, today.day,
                slot["hour"], slot["minute"], 0,
                tzinfo=timezone.utc,
            ) - timedelta(hours=timezone_offset)

            # Only schedule future times
            if publish_time > datetime.now(timezone.utc):
                schedule.append(publish_time)

        # Fill remaining with evenly spaced times in the evening
        while len(schedule) < posts_per_day:
            base_hour = 17 + len(schedule)
            if base_hour > 22:
                base_hour = 12 + len(schedule)
            t = datetime(
                today.year, today.month, today.day,
                min(base_hour, 22), 0, 0,
                tzinfo=timezone.utc,
            ) - timedelta(hours=timezone_offset)
            schedule.append(t)

        return sorted(schedule)

    def _build_engagement_heatmap(
        self,
        posts: list[dict],
        timezone_offset: int,
    ) -> dict[tuple[int, int], float]:
        """Build a (day, hour) -> avg_engagement heatmap from posts."""
        engagement_by_slot = defaultdict(list)

        for post in posts:
            published_at = post.get("published_at")
            engagement = post.get("engagement_data", {})

            if not published_at:
                continue

            # Parse datetime
            if isinstance(published_at, str):
                try:
                    dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                except ValueError:
                    continue
            elif isinstance(published_at, datetime):
                dt = published_at
            else:
                continue

            # Convert to local time
            local_dt = dt + timedelta(hours=timezone_offset)
            day = local_dt.weekday()
            hour = local_dt.hour

            # Calculate engagement score
            likes = engagement.get("likes", 0) or 0
            comments = engagement.get("comments", 0) or 0
            shares = engagement.get("shares", 0) or 0
            score = likes + (comments * 3) + (shares * 5)  # Weight interactions

            engagement_by_slot[(day, hour)].append(score)

        # Average engagement per slot
        heatmap = {}
        if engagement_by_slot:
            max_eng = max(
                sum(v) / len(v) for v in engagement_by_slot.values()
            ) or 1

            for slot, scores in engagement_by_slot.items():
                avg = sum(scores) / len(scores)
                heatmap[slot] = avg / max_eng  # Normalize to 0-1

        return heatmap

    def _merge_with_priors(self, heatmap: dict) -> dict:
        """Merge data-driven heatmap with default priors."""
        merged = {}

        # Add all priors
        for day, hours in DEFAULT_PRIORS.items():
            for hour, prior_score in hours.items():
                data_score = heatmap.get((day, hour), 0)
                if data_score > 0:
                    merged[(day, hour)] = (
                        self.data_weight * data_score +
                        self.prior_weight * prior_score
                    )
                else:
                    merged[(day, hour)] = self.prior_weight * prior_score

        # Add any data-only slots not in priors
        for (day, hour), score in heatmap.items():
            if (day, hour) not in merged:
                merged[(day, hour)] = self.data_weight * score

        return merged

    def _explain_slot(self, day: int, hour: int, score: float, heatmap: dict) -> str:
        """Generate human-readable explanation for a time slot."""
        day_name = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day]
        has_data = (day, hour) in heatmap

        if score > 0.85:
            prefix = "Peak engagement"
        elif score > 0.65:
            prefix = "High engagement"
        else:
            prefix = "Good engagement"

        source = "from your data" if has_data else "industry average"
        return f"{prefix} {day_name} {hour}:00 ({source})"

    def _next_occurrence(self, now: datetime, target_day: int, hour: int, minute: int) -> datetime:
        """Find next occurrence of a specific day/hour from now."""
        days_ahead = target_day - now.weekday()
        if days_ahead < 0:
            days_ahead += 7
        elif days_ahead == 0:
            target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if target_time > now:
                return target_time
            days_ahead = 7

        target_date = now + timedelta(days=days_ahead)
        return target_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

    def _get_default_slots(self, count: int, existing: list) -> list[dict]:
        """Fill with default prime-time slots."""
        defaults = [
            {"day": 4, "day_name": "Friday", "hour": 19, "minute": 30, "score": 0.9, "reason": "Friday evening prime time (default)"},
            {"day": 3, "day_name": "Thursday", "hour": 19, "minute": 0, "score": 0.8, "reason": "Thursday evening (default)"},
            {"day": 5, "day_name": "Saturday", "hour": 19, "minute": 0, "score": 0.8, "reason": "Saturday evening (default)"},
            {"day": 6, "day_name": "Sunday", "hour": 12, "minute": 0, "score": 0.65, "reason": "Sunday midday (default)"},
            {"day": 1, "day_name": "Tuesday", "hour": 19, "minute": 0, "score": 0.7, "reason": "Tuesday evening (default)"},
        ]
        result = []
        for d in defaults:
            if len(result) >= count:
                break
            # Skip if already in existing
            overlap = any(e["day"] == d["day"] and e["hour"] == d["hour"] for e in existing)
            if not overlap:
                result.append(d)
        return result
