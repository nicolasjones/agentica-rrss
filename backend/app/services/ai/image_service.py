"""
AGENMATICA - Image Generation Service
Generates band-specific images using Flux Pro via Replicate.
Supports mock mode for development without API keys.
"""

import random
import asyncio
from abc import ABC, abstractmethod
from typing import Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


class BaseImageService(ABC):
    """Interface for image generation services."""

    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        style: str = "realistic",
        aspect_ratio: str = "1:1",
    ) -> dict:
        """Generate an image from a text prompt."""
        pass

    @abstractmethod
    async def generate_post_image(
        self,
        band_profile: dict,
        post_caption: str,
        mood: str = "energetic",
    ) -> dict:
        """Generate an image specifically for a social media post."""
        pass


class MockImageService(BaseImageService):
    """Mock image service for development."""

    MOCK_URLS = [
        "https://mock-cdn.agenmatica.com/images/band_live_001.jpg",
        "https://mock-cdn.agenmatica.com/images/band_studio_002.jpg",
        "https://mock-cdn.agenmatica.com/images/band_backstage_003.jpg",
        "https://mock-cdn.agenmatica.com/images/band_poster_004.jpg",
        "https://mock-cdn.agenmatica.com/images/band_aesthetic_005.jpg",
        "https://mock-cdn.agenmatica.com/images/band_crowd_006.jpg",
        "https://mock-cdn.agenmatica.com/images/band_guitar_007.jpg",
        "https://mock-cdn.agenmatica.com/images/band_night_008.jpg",
    ]

    async def generate_image(
        self,
        prompt: str,
        style: str = "realistic",
        aspect_ratio: str = "1:1",
    ) -> dict:
        await asyncio.sleep(random.uniform(0.5, 1.5))
        return {
            "url": random.choice(self.MOCK_URLS),
            "prompt_used": prompt,
            "style": style,
            "aspect_ratio": aspect_ratio,
            "model": "mock-flux-pro",
            "generation_time_ms": random.randint(2000, 8000),
            "cost_usd": 0.0,
        }

    async def generate_post_image(
        self,
        band_profile: dict,
        post_caption: str,
        mood: str = "energetic",
    ) -> dict:
        prompt = self._build_band_prompt(band_profile, post_caption, mood)
        return await self.generate_image(prompt)

    def _build_band_prompt(self, band_profile: dict, caption: str, mood: str) -> str:
        band_name = band_profile.get("name", "rock band")
        genre = band_profile.get("genre", "rock")
        return (
            f"Concert photography style, {genre} band aesthetic, "
            f"mood: {mood}, inspired by: {caption[:80]}. "
            f"Dark tones, stage lighting, authentic feel. "
            f"No text, no logos, no faces."
        )


class ReplicateImageService(BaseImageService):
    """Real image generation using Replicate API (Flux Pro)."""

    BASE_URL = "https://api.replicate.com/v1"

    def __init__(self):
        self.api_token = settings.replicate_api_token
        self.model = settings.replicate_model

    async def generate_image(
        self,
        prompt: str,
        style: str = "realistic",
        aspect_ratio: str = "1:1",
    ) -> dict:
        import time
        start = time.time()

        async with httpx.AsyncClient() as client:
            # Create prediction
            resp = await client.post(
                f"{self.BASE_URL}/predictions",
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "version": self._get_model_version(),
                    "input": {
                        "prompt": prompt,
                        "aspect_ratio": aspect_ratio,
                        "num_outputs": 1,
                        "guidance_scale": 3.5,
                        "num_inference_steps": 28,
                        "output_format": "jpg",
                        "output_quality": 90,
                    },
                },
                timeout=30.0,
            )
            resp.raise_for_status()
            prediction = resp.json()

            # Poll for completion
            prediction_url = prediction["urls"]["get"]
            image_url = None
            for _ in range(60):  # max 60 seconds
                await asyncio.sleep(1)
                poll_resp = await client.get(
                    prediction_url,
                    headers={"Authorization": f"Bearer {self.api_token}"},
                )
                poll_data = poll_resp.json()

                if poll_data["status"] == "succeeded":
                    output = poll_data.get("output")
                    image_url = output[0] if isinstance(output, list) else output
                    break
                elif poll_data["status"] == "failed":
                    raise Exception(f"Image generation failed: {poll_data.get('error')}")

        generation_time = int((time.time() - start) * 1000)

        return {
            "url": image_url,
            "prompt_used": prompt,
            "style": style,
            "aspect_ratio": aspect_ratio,
            "model": self.model,
            "generation_time_ms": generation_time,
            "cost_usd": 0.012,  # ~$0.008-0.02 per image
        }

    async def generate_post_image(
        self,
        band_profile: dict,
        post_caption: str,
        mood: str = "energetic",
    ) -> dict:
        prompt = self._build_band_prompt(band_profile, post_caption, mood)
        return await self.generate_image(prompt)

    def _build_band_prompt(self, band_profile: dict, caption: str, mood: str) -> str:
        genre = band_profile.get("genre", "rock")
        tone = ", ".join(band_profile.get("tone_keywords", ["energetic"]))
        return (
            f"Professional concert photography, {genre} music aesthetic. "
            f"Mood: {mood}, tone: {tone}. "
            f"Context: {caption[:100]}. "
            f"Dramatic stage lighting, authentic live music feel, "
            f"dark atmospheric tones, shallow depth of field. "
            f"No text overlay, no logos, no identifiable faces."
        )

    def _get_model_version(self) -> str:
        # Flux Pro latest stable version hash
        return "af1a27764a8b57bece78e46203242c3a5e00812ab4e52ef96336e4e1a1c0940"


# ─── Platform-specific sizing ────────────────────────

IMAGE_SIZES = {
    "instagram": {"aspect_ratio": "1:1", "width": 1080, "height": 1080},
    "instagram_story": {"aspect_ratio": "9:16", "width": 1080, "height": 1920},
    "tiktok": {"aspect_ratio": "9:16", "width": 1080, "height": 1920},
    "youtube_thumbnail": {"aspect_ratio": "16:9", "width": 1280, "height": 720},
    "twitter": {"aspect_ratio": "16:9", "width": 1200, "height": 675},
    "facebook": {"aspect_ratio": "1:1", "width": 1080, "height": 1080},
}


def get_image_size(platform: str) -> dict:
    """Get optimal image dimensions for a platform."""
    return IMAGE_SIZES.get(platform, IMAGE_SIZES["instagram"])


def get_image_service() -> BaseImageService:
    """Factory: returns mock or real image service."""
    if settings.mock_image_gen:
        return MockImageService()
    return ReplicateImageService()
