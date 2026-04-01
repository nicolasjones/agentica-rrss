"""
AGENMATICA - LLM Service
Abstraction layer for post generation using Together.ai (Llama 13B).
Supports mock mode for development without API keys.
"""

import time
import random
from abc import ABC, abstractmethod
from typing import Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


class BaseLLMService(ABC):
    """Interface for LLM services."""

    @abstractmethod
    async def generate_post(
        self,
        band_profile: dict,
        context: Optional[dict] = None,
        platform: str = "instagram",
    ) -> dict:
        """Generate a social media post."""
        pass

    @abstractmethod
    async def analyze_tone(self, text: str) -> dict:
        """Analyze tone/sentiment of a text."""
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> list[float]:
        """Generate embedding vector for text."""
        pass


class MockLLMService(BaseLLMService):
    """Mock LLM for development without API keys."""

    MOCK_POSTS = {
        "instagram": [
            {
                "caption": "Este viernes nos vemos en Niceto Club 🎸 Traemos los temas nuevos, energía pura y una sorpresa al final. ¿Vos venís? 🔥",
                "hashtags": ["#SientesLive", "#RockAlternativo", "#NicetoClub", "#ViernesDeRock"],
                "emoji": "🎸🔥",
                "cta": "Link en bio para entradas",
            },
            {
                "caption": "Ensayo a fondo. Nuevo tema tomando forma. Pronto van a escucharlo 👀🎶",
                "hashtags": ["#NuevaMusica", "#Ensayo", "#RockArgentino", "#ComingSoon"],
                "emoji": "👀🎶",
                "cta": "Activen notificaciones 🔔",
            },
            {
                "caption": "Gracias a todos los que vinieron ayer. Esa energía no se explica, se vive. Nos vemos en la próxima 💜",
                "hashtags": ["#GraciasPublico", "#RockEnVivo", "#Sientes", "#BuenosAires"],
                "emoji": "💜🤘",
                "cta": "Tagueá a alguien que estuvo ahí",
            },
            {
                "caption": "Detrás de escena: así suena el estudio a las 3am cuando nadie duerme y la música no para 🌙",
                "hashtags": ["#BehindTheScenes", "#Estudio", "#RockNocturno", "#Proceso"],
                "emoji": "🌙🎵",
                "cta": "¿Querés escuchar un adelanto?",
            },
            {
                "caption": "Nuevo single 'Perdidos en la Noche' disponible en todas las plataformas. Dale play y contanos qué sentís 🎧",
                "hashtags": ["#NuevoSingle", "#PerdidosEnLaNoche", "#StreamNow", "#RockAlternativo"],
                "emoji": "🎧🔥",
                "cta": "Link en bio 🔗",
            },
        ],
        "tiktok": [
            {
                "caption": "@sientes Nuevo single OUT NOW 🎸🔥",
                "hashtags": ["#NewMusic", "#RockArgentino", "#fyp", "#musica"],
                "emoji": "🎸🔥",
                "cta": "",
            },
        ],
    }

    async def generate_post(
        self,
        band_profile: dict,
        context: Optional[dict] = None,
        platform: str = "instagram",
    ) -> dict:
        await self._simulate_latency()
        posts = self.MOCK_POSTS.get(platform, self.MOCK_POSTS["instagram"])
        post = random.choice(posts)
        return {
            **post,
            "model_used": "mock-llm",
            "generation_time_ms": random.randint(800, 2000),
            "approval_score": round(random.uniform(0.65, 0.95), 2),
        }

    async def analyze_tone(self, text: str) -> dict:
        await self._simulate_latency()
        return {
            "tone": random.choice(["energetic", "melancholic", "sarcastic", "celebratory"]),
            "sentiment": round(random.uniform(0.3, 0.9), 2),
            "keywords": ["rock", "música", "energía", "show"],
            "themes": ["live_performance", "new_music", "fan_engagement"],
        }

    async def generate_embedding(self, text: str) -> list[float]:
        """Generate a mock embedding vector."""
        await self._simulate_latency()
        return [random.uniform(-1, 1) for _ in range(settings.embedding_dimensions)]

    async def _simulate_latency(self):
        """Simulate API latency for realistic development."""
        import asyncio
        await asyncio.sleep(random.uniform(0.3, 1.0))


class TogetherLLMService(BaseLLMService):
    """Real LLM service using Together.ai API."""

    def __init__(self):
        self.api_key = settings.together_api_key
        self.model = settings.together_model
        self.base_url = "https://api.together.ai/v1"

    async def generate_post(
        self,
        band_profile: dict,
        context: Optional[dict] = None,
        platform: str = "instagram",
    ) -> dict:
        start = time.time()

        system_prompt = self._build_system_prompt(band_profile, platform)
        user_prompt = self._build_user_prompt(band_profile, context, platform)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": settings.together_max_tokens,
                    "temperature": settings.together_temperature,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

        generation_time = int((time.time() - start) * 1000)
        content = data["choices"][0]["message"]["content"]

        # Parse structured output from LLM
        parsed = self._parse_post_output(content)
        parsed["model_used"] = self.model
        parsed["generation_time_ms"] = generation_time
        return parsed

    async def analyze_tone(self, text: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a social media content analyst for rock bands. "
                                "Analyze the tone, sentiment, keywords, and themes of the text. "
                                "Respond in JSON format: {tone, sentiment (0-1), keywords: [], themes: []}"
                            ),
                        },
                        {"role": "user", "content": f"Analyze: {text}"},
                    ],
                    "max_tokens": 256,
                    "temperature": 0.3,
                },
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()

        import json
        try:
            return json.loads(data["choices"][0]["message"]["content"])
        except (json.JSONDecodeError, KeyError):
            return {"tone": "unknown", "sentiment": 0.5, "keywords": [], "themes": []}

    async def generate_embedding(self, text: str) -> list[float]:
        # Together.ai embeddings endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "togethercomputer/m2-bert-80M-8k-retrieval",
                    "input": text,
                },
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()
        return data["data"][0]["embedding"]

    def _build_system_prompt(self, band_profile: dict, platform: str) -> str:
        return f"""You are an expert social media content creator for rock bands.
You write posts in Spanish (Argentine dialect) that sound authentic and engaging.

BAND PROFILE:
- Name: {band_profile.get('name', 'Unknown')}
- Genre: {band_profile.get('genre', 'Rock')}
- Tone: {', '.join(band_profile.get('tone_keywords', ['energetic']))}
- Values: {', '.join(band_profile.get('values_keywords', ['authenticity']))}
- Audience: {band_profile.get('audience_age_range', '18-30')}, {band_profile.get('audience_location', 'Argentina')}

PLATFORM: {platform}
RULES:
- Write as if YOU ARE the band (first person plural)
- Use Argentine Spanish slang naturally
- Include relevant emojis (not excessive)
- Suggest 4-6 hashtags (mix popular + niche)
- Include a CTA (call to action)
- Keep it authentic, NOT corporate

Respond in this exact format:
CAPTION: [the post text]
HASHTAGS: [comma-separated hashtags]
EMOJI: [key emojis used]
CTA: [call to action]"""

    def _build_user_prompt(self, band_profile: dict, context: Optional[dict], platform: str) -> str:
        prompt = f"Generate a {platform} post for {band_profile.get('name', 'the band')}."
        if context:
            if context.get("topic"):
                prompt += f" Topic: {context['topic']}."
            if context.get("upcoming_event"):
                prompt += f" Upcoming event: {context['upcoming_event']}."
            if context.get("mood"):
                prompt += f" Mood: {context['mood']}."
        return prompt

    def _parse_post_output(self, content: str) -> dict:
        """Parse structured LLM output into post dict."""
        lines = content.strip().split("\n")
        result = {"caption": "", "hashtags": [], "emoji": "", "cta": ""}

        for line in lines:
            line = line.strip()
            if line.startswith("CAPTION:"):
                result["caption"] = line.replace("CAPTION:", "").strip()
            elif line.startswith("HASHTAGS:"):
                raw = line.replace("HASHTAGS:", "").strip()
                result["hashtags"] = [h.strip() for h in raw.split(",") if h.strip()]
            elif line.startswith("EMOJI:"):
                result["emoji"] = line.replace("EMOJI:", "").strip()
            elif line.startswith("CTA:"):
                result["cta"] = line.replace("CTA:", "").strip()

        if not result["caption"]:
            result["caption"] = content.strip()

        return result


def get_llm_service() -> BaseLLMService:
    """Factory: returns mock or real LLM based on config."""
    if settings.mock_llm:
        return MockLLMService()
    return TogetherLLMService()
