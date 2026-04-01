"""
AGENMATICA - Pattern Discovery Service
Analyzes scanned posts to discover content patterns.
Runs after network scanning and during weekly learning loop.

Discovers:
- Content type performance (shows > covers, etc.)
- Timing patterns (Friday 19:30 = gold)
- Tone/sentiment correlations
- Engagement trends
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.core.config import get_settings

settings = get_settings()


class PatternDiscoveryService:
    """
    Analyzes historical posts to discover actionable patterns.
    These patterns feed into the Band Profile and prompt generation.
    """

    def discover_all_patterns(
        self,
        posts: list[dict],
        timezone_offset: int = -3,
    ) -> list[dict]:
        """
        Run all pattern discovery algorithms on a set of posts.
        
        Args:
            posts: List of content_posts with engagement_data and tone_analysis
            
        Returns:
            List of discovered patterns
        """
        patterns = []

        if len(posts) < 5:
            return patterns

        patterns.extend(self._discover_content_type_patterns(posts))
        patterns.extend(self._discover_timing_patterns(posts, timezone_offset))
        patterns.extend(self._discover_tone_patterns(posts))
        patterns.extend(self._discover_engagement_trends(posts))
        patterns.extend(self._discover_caption_length_patterns(posts))

        return patterns

    def _discover_content_type_patterns(self, posts: list[dict]) -> list[dict]:
        """Which content types perform best? (images vs videos vs carousels)"""
        patterns = []
        type_engagement = defaultdict(list)

        for post in posts:
            media_type = post.get("media_type", "image")
            eng = self._calc_engagement_score(post.get("engagement_data", {}))
            type_engagement[media_type].append(eng)

        if not type_engagement:
            return patterns

        # Calculate averages
        type_avgs = {}
        for content_type, scores in type_engagement.items():
            type_avgs[content_type] = sum(scores) / len(scores) if scores else 0

        global_avg = sum(
            s for scores in type_engagement.values() for s in scores
        ) / max(sum(len(s) for s in type_engagement.values()), 1)

        # Find standout types
        for content_type, avg in sorted(type_avgs.items(), key=lambda x: x[1], reverse=True):
            if global_avg > 0:
                multiplier = round(avg / global_avg, 1)
            else:
                multiplier = 1.0

            count = len(type_engagement[content_type])

            patterns.append({
                "pattern_type": "content_type",
                "pattern_name": f"{content_type.title()} posts: {multiplier}x avg engagement",
                "pattern_data": {
                    "content_type": content_type,
                    "avg_engagement": round(avg, 1),
                    "multiplier": multiplier,
                    "sample_size": count,
                },
                "avg_performance": round(avg / max(global_avg, 1), 3),
                "confidence": min(0.95, 0.5 + (count / 50)),  # More posts = higher confidence
            })

        return patterns

    def _discover_timing_patterns(self, posts: list[dict], tz_offset: int) -> list[dict]:
        """When do posts perform best?"""
        patterns = []
        hour_engagement = defaultdict(list)
        day_engagement = defaultdict(list)

        for post in posts:
            published_at = post.get("published_at")
            if not published_at:
                continue

            dt = self._parse_datetime(published_at)
            if not dt:
                continue

            local_dt = dt + timedelta(hours=tz_offset)
            eng = self._calc_engagement_score(post.get("engagement_data", {}))

            hour_engagement[local_dt.hour].append(eng)
            day_engagement[local_dt.weekday()].append(eng)

        # Best hour
        if hour_engagement:
            best_hour = max(hour_engagement.items(), key=lambda x: sum(x[1]) / len(x[1]))
            hour, scores = best_hour
            avg = sum(scores) / len(scores)

            patterns.append({
                "pattern_type": "timing_hour",
                "pattern_name": f"Best posting time: {hour}:00 ({len(scores)} posts)",
                "pattern_data": {
                    "hour": hour,
                    "avg_engagement": round(avg, 1),
                    "sample_size": len(scores),
                },
                "avg_performance": round(avg, 1),
                "confidence": min(0.9, 0.4 + (len(scores) / 30)),
            })

        # Best day
        if day_engagement:
            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            best_day = max(day_engagement.items(), key=lambda x: sum(x[1]) / len(x[1]))
            day, scores = best_day
            avg = sum(scores) / len(scores)

            patterns.append({
                "pattern_type": "timing_day",
                "pattern_name": f"Best day: {day_names[day]} ({len(scores)} posts)",
                "pattern_data": {
                    "day": day,
                    "day_name": day_names[day],
                    "avg_engagement": round(avg, 1),
                    "sample_size": len(scores),
                },
                "avg_performance": round(avg, 1),
                "confidence": min(0.85, 0.4 + (len(scores) / 20)),
            })

        return patterns

    def _discover_tone_patterns(self, posts: list[dict]) -> list[dict]:
        """Which tones correlate with higher engagement?"""
        patterns = []
        tone_engagement = defaultdict(list)

        for post in posts:
            tone_data = post.get("tone_analysis")
            if not tone_data or not isinstance(tone_data, dict):
                continue

            tone = tone_data.get("tone", "unknown")
            eng = self._calc_engagement_score(post.get("engagement_data", {}))
            tone_engagement[tone].append(eng)

        if not tone_engagement:
            return patterns

        for tone, scores in sorted(tone_engagement.items(), key=lambda x: sum(x[1]) / len(x[1]), reverse=True):
            if len(scores) < 3:
                continue

            avg = sum(scores) / len(scores)
            patterns.append({
                "pattern_type": "tone",
                "pattern_name": f"'{tone}' tone: avg {round(avg, 0)} engagement",
                "pattern_data": {
                    "tone": tone,
                    "avg_engagement": round(avg, 1),
                    "sample_size": len(scores),
                },
                "avg_performance": round(avg, 1),
                "confidence": min(0.8, 0.3 + (len(scores) / 25)),
            })

        return patterns[:3]  # Top 3 tones

    def _discover_engagement_trends(self, posts: list[dict]) -> list[dict]:
        """Is engagement trending up or down over time?"""
        patterns = []
        dated_posts = []

        for post in posts:
            published_at = post.get("published_at")
            if not published_at:
                continue
            dt = self._parse_datetime(published_at)
            if not dt:
                continue
            eng = self._calc_engagement_score(post.get("engagement_data", {}))
            dated_posts.append((dt, eng))

        if len(dated_posts) < 10:
            return patterns

        dated_posts.sort(key=lambda x: x[0])

        # Split into halves
        mid = len(dated_posts) // 2
        first_half = [e for _, e in dated_posts[:mid]]
        second_half = [e for _, e in dated_posts[mid:]]

        avg_first = sum(first_half) / len(first_half)
        avg_second = sum(second_half) / len(second_half)

        if avg_first > 0:
            change_pct = ((avg_second - avg_first) / avg_first) * 100
        else:
            change_pct = 0

        direction = "up" if change_pct > 5 else "down" if change_pct < -5 else "stable"

        patterns.append({
            "pattern_type": "trend",
            "pattern_name": f"Engagement trending {direction} ({change_pct:+.0f}%)",
            "pattern_data": {
                "direction": direction,
                "change_percent": round(change_pct, 1),
                "avg_early": round(avg_first, 1),
                "avg_recent": round(avg_second, 1),
                "total_posts": len(dated_posts),
            },
            "avg_performance": round(avg_second, 1),
            "confidence": min(0.85, 0.5 + (len(dated_posts) / 100)),
        })

        return patterns

    def _discover_caption_length_patterns(self, posts: list[dict]) -> list[dict]:
        """Do shorter or longer captions perform better?"""
        patterns = []
        length_buckets = {"short": [], "medium": [], "long": []}

        for post in posts:
            caption = post.get("caption", "")
            eng = self._calc_engagement_score(post.get("engagement_data", {}))

            if not caption:
                continue

            length = len(caption)
            if length < 80:
                length_buckets["short"].append(eng)
            elif length < 200:
                length_buckets["medium"].append(eng)
            else:
                length_buckets["long"].append(eng)

        best_bucket = None
        best_avg = 0
        for bucket, scores in length_buckets.items():
            if len(scores) >= 3:
                avg = sum(scores) / len(scores)
                if avg > best_avg:
                    best_avg = avg
                    best_bucket = bucket

        if best_bucket:
            ranges = {"short": "<80 chars", "medium": "80-200 chars", "long": "200+ chars"}
            patterns.append({
                "pattern_type": "caption_length",
                "pattern_name": f"{best_bucket.title()} captions ({ranges[best_bucket]}) perform best",
                "pattern_data": {
                    "optimal_length": best_bucket,
                    "range": ranges[best_bucket],
                    "avg_engagement": round(best_avg, 1),
                    "sample_size": len(length_buckets[best_bucket]),
                },
                "avg_performance": round(best_avg, 1),
                "confidence": min(0.75, 0.3 + (len(length_buckets[best_bucket]) / 30)),
            })

        return patterns

    # ─── Helpers ──────────────────────────────────────

    def _calc_engagement_score(self, engagement: dict) -> float:
        """Calculate weighted engagement score."""
        if not engagement:
            return 0
        likes = engagement.get("likes", 0) or 0
        comments = engagement.get("comments", 0) or 0
        shares = engagement.get("shares", 0) or 0
        saves = engagement.get("saves", 0) or 0
        return likes + (comments * 3) + (shares * 5) + (saves * 2)

    def _parse_datetime(self, value) -> Optional[datetime]:
        """Parse datetime from string or datetime object."""
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None
