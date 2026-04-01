"""
AGENMATICA - Social Media Service
Abstraction for Instagram/TikTok/YouTube APIs.
Mock mode for development without OAuth keys.
"""

import random
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


class BaseSocialService(ABC):
    @abstractmethod
    async def get_auth_url(self, platform: str) -> str:
        pass

    @abstractmethod
    async def exchange_code(self, platform: str, code: str) -> dict:
        pass

    @abstractmethod
    async def fetch_posts(self, platform: str, token: str, limit: int = 100) -> list[dict]:
        pass

    @abstractmethod
    async def publish_post(self, platform: str, token: str, caption: str, media_url: Optional[str] = None) -> dict:
        pass

    @abstractmethod
    async def get_profile(self, platform: str, token: str) -> dict:
        pass


class MockSocialService(BaseSocialService):
    """Mock social service with realistic Sientes-like data."""

    SIENTES_POSTS = [
        {"caption": "Viernes en Niceto Club. Energía pura 🎸", "likes": 420, "comments": 35, "type": "image", "topic": "show"},
        {"caption": "Nuevo tema en camino. Esto se pone heavy 🔥", "likes": 310, "comments": 22, "type": "image", "topic": "new_music"},
        {"caption": "Ensayo a las 3am. La magia pasa de noche 🌙", "likes": 280, "comments": 18, "type": "image", "topic": "behind_scenes"},
        {"caption": "Gracias La Trastienda! Noche inolvidable 💜", "likes": 520, "comments": 48, "type": "carousel", "topic": "show"},
        {"caption": "Cover de Cerati que teníamos guardado. Dale play 🎶", "likes": 85, "comments": 8, "type": "video", "topic": "cover"},
        {"caption": "Detrás del amplificador: cómo suena el delay perfecto", "likes": 190, "comments": 15, "type": "video", "topic": "behind_scenes"},
        {"caption": "Sábado, Groove, 23hs. No hay excusas 🤘", "likes": 350, "comments": 30, "type": "image", "topic": "show"},
        {"caption": "Grabando voces para el EP. Se viene algo grande 🎤", "likes": 245, "comments": 20, "type": "image", "topic": "recording"},
        {"caption": "Playlist de viernes: lo que escuchamos antes de tocar", "likes": 160, "comments": 12, "type": "image", "topic": "lifestyle"},
        {"caption": "Último show del año. Rompemos todo 💥", "likes": 680, "comments": 72, "type": "carousel", "topic": "show"},
    ]

    async def get_auth_url(self, platform: str) -> str:
        return f"{settings.backend_url}/api/v1/auth/mock/{platform}/callback?code=mock_code_12345"

    async def exchange_code(self, platform: str, code: str) -> dict:
        return {
            "access_token": f"mock_token_{platform}_{''.join(random.choices('abcdef0123456789', k=16))}",
            "refresh_token": f"mock_refresh_{platform}",
            "expires_in": 3600 * 24 * 60,  # 60 days
            "user_id": f"mock_user_{platform}_001",
            "username": "sientes_banda",
        }

    async def fetch_posts(self, platform: str, token: str, limit: int = 100) -> list[dict]:
        """Generate mock historical posts for scanning."""
        posts = []
        now = datetime.now(timezone.utc)

        for i in range(min(limit, 157)):  # Sientes has 157 posts
            base = random.choice(self.SIENTES_POSTS)
            published = now - timedelta(days=random.randint(1, 365))
            posts.append({
                "platform_post_id": f"mock_{platform}_{i:04d}",
                "caption": base["caption"],
                "media_type": base["type"],
                "media_url": f"https://mock-cdn.agenmatica.com/{platform}/{i:04d}.jpg",
                "published_at": published.isoformat(),
                "permalink": f"https://{platform}.com/p/mock_{i:04d}",
                "engagement_data": {
                    "likes": base["likes"] + random.randint(-50, 100),
                    "comments": base["comments"] + random.randint(-5, 15),
                    "shares": random.randint(0, 30),
                    "saves": random.randint(5, 80),
                    "views": random.randint(500, 5000) if base["type"] == "video" else None,
                },
            })

        return sorted(posts, key=lambda p: p["published_at"], reverse=True)

    async def publish_post(self, platform: str, token: str, caption: str, media_url: Optional[str] = None) -> dict:
        return {
            "success": True,
            "platform_post_id": f"mock_published_{random.randint(10000, 99999)}",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "url": f"https://{platform}.com/p/mock_published",
        }

    async def get_profile(self, platform: str, token: str) -> dict:
        return {
            "user_id": "mock_user_001",
            "username": "sientes_banda",
            "followers_count": 15234,
            "following_count": 892,
            "posts_count": 157,
            "bio": "Rock alternativo desde Buenos Aires 🎸 Booking: sientes@gmail.com",
        }


class InstagramService(BaseSocialService):
    """Real Instagram Graph API integration."""

    BASE_URL = "https://graph.instagram.com"
    AUTH_URL = "https://api.instagram.com/oauth/authorize"

    async def get_auth_url(self, platform: str) -> str:
        return (
            f"{self.AUTH_URL}"
            f"?client_id={settings.instagram_app_id}"
            f"&redirect_uri={settings.instagram_redirect_uri}"
            f"&scope=user_profile,user_media"
            f"&response_type=code"
        )

    async def exchange_code(self, platform: str, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            # Short-lived token
            resp = await client.post(
                "https://api.instagram.com/oauth/access_token",
                data={
                    "client_id": settings.instagram_app_id,
                    "client_secret": settings.instagram_app_secret,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.instagram_redirect_uri,
                    "code": code,
                },
            )
            resp.raise_for_status()
            short_data = resp.json()

            # Exchange for long-lived token
            resp2 = await client.get(
                f"{self.BASE_URL}/access_token",
                params={
                    "grant_type": "ig_exchange_token",
                    "client_secret": settings.instagram_app_secret,
                    "access_token": short_data["access_token"],
                },
            )
            resp2.raise_for_status()
            long_data = resp2.json()

        return {
            "access_token": long_data["access_token"],
            "expires_in": long_data.get("expires_in", 5184000),
            "user_id": str(short_data["user_id"]),
        }

    async def fetch_posts(self, platform: str, token: str, limit: int = 100) -> list[dict]:
        posts = []
        url = f"{self.BASE_URL}/me/media"
        params = {
            "fields": "id,caption,media_type,media_url,timestamp,permalink,like_count,comments_count",
            "access_token": token,
            "limit": min(limit, 50),
        }

        async with httpx.AsyncClient() as client:
            while len(posts) < limit:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()

                for item in data.get("data", []):
                    posts.append({
                        "platform_post_id": item["id"],
                        "caption": item.get("caption", ""),
                        "media_type": item.get("media_type", "IMAGE").lower(),
                        "media_url": item.get("media_url"),
                        "published_at": item.get("timestamp"),
                        "permalink": item.get("permalink"),
                        "engagement_data": {
                            "likes": item.get("like_count", 0),
                            "comments": item.get("comments_count", 0),
                        },
                    })

                # Pagination
                next_url = data.get("paging", {}).get("next")
                if not next_url or len(posts) >= limit:
                    break
                url = next_url
                params = {}

        return posts

    async def publish_post(self, platform: str, token: str, caption: str, media_url: Optional[str] = None) -> dict:
        # Instagram Graph API publish flow (requires business account)
        # Step 1: Create media container
        # Step 2: Publish container
        # Simplified for MVP
        raise NotImplementedError("Instagram publishing requires Business account setup")

    async def get_profile(self, platform: str, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/me",
                params={
                    "fields": "id,username,media_count,account_type",
                    "access_token": token,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        return {
            "user_id": data["id"],
            "username": data.get("username"),
            "posts_count": data.get("media_count", 0),
        }


def get_social_service() -> BaseSocialService:
    """Factory: returns mock or real social service."""
    if settings.mock_social_apis:
        return MockSocialService()
    return InstagramService()
