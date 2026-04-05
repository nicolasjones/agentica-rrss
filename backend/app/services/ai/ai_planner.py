"""
AGENMATICA - Strategist Agent (AI Planner)
Two-phase content pipeline:
  Phase 1 — MAPA (Ideation): generate_batch() → concept_title + narrative_goal, no caption.
  Phase 2 — SEÑAL (Signal):  generate_signals() → captions from approved concepts.

Supports mock mode for development without API keys.
"""

import random
import json
from abc import ABC, abstractmethod
from datetime import date, timedelta

import httpx

from app.core.config import get_settings

settings = get_settings()

PLATFORMS = ["instagram", "facebook", "tiktok", "youtube"]

# ─── Concept archetypes (Phase 1 / MAPA) ──────────────

CONCEPT_ARCHETYPES = {
    "pre": {
        "title": "Expectativa pre-evento",
        "goal": "Generar misterio e hype antes del evento. Activar FOMO en la audiencia.",
    },
    "day": {
        "title": "Activación en vivo",
        "goal": "Conectar con la audiencia en tiempo real. Transmitir energía del momento.",
    },
    "post": {
        "title": "Recap emocional",
        "goal": "Capitalizar momentum y testimonios post-evento. Agradecer y extender la vibra.",
    },
    "neutral": {
        "title": "Contenido de identidad",
        "goal": "Reforzar el ADN de marca sin anclarse a un evento puntual. Humanizar al artista.",
    },
}

# ─── Signal captions (Phase 2 / SEÑAL) ────────────────

SIGNAL_CAPTIONS = {
    "pre": [
        "El {date} es la fecha. Prepárense. 🔥 #ComingSoon",
        "Quedan días. La energía ya está en el aire 🎸 #HypeMode",
        "¿Listos? {title} se viene y no hay vuelta atrás. 💀",
    ],
    "day": [
        "Hoy es el día. Los esperamos con todo 🤘",
        "Esta noche lo damos todo. Nos vemos ahí 🔥",
        "Día de show. Energía al 1000. ¿Vienen? 🎶",
    ],
    "post": [
        "Gracias por todo. Esa energía no se olvida 💜",
        "Lo que pasó anoche fue otra cosa. Gracias, gracias, gracias. 🙌",
        "El show terminó pero la vibra sigue. La próxima es pronto 👀",
    ],
    "neutral": [
        "En el estudio. Algo nuevo está tomando forma 🎛️ #BehindTheScenes",
        "La música no para aunque nadie lo vea 🌙 #Process",
        "¿Qué temas quieren que toquemos en el próximo show? 👇",
        "Nuevo contenido en camino. Activen notificaciones 🔔",
    ],
}


def _infer_archetype(concept_title: str) -> str:
    """Infer the narrative archetype from a concept_title string."""
    t = concept_title.lower()
    if any(k in t for k in ("expectativa", "pre-evento", "hype", "coming")):
        return "pre"
    if any(k in t for k in ("activación", "vivo", "en vivo", "live")):
        return "day"
    if any(k in t for k in ("recap", "emocional", "gracias", "post-evento")):
        return "post"
    return "neutral"


# ─── Abstract base ─────────────────────────────────────

class BaseAIPlanner(ABC):

    @abstractmethod
    async def generate_batch(self, band, events: list, timeframe: str, volume: int = 5) -> list[dict]:
        """
        Phase 1 — MAPA: Return proposed concept dicts.
        Each dict: { event_id, platform, concept_title, narrative_goal, caption=None, hashtags, scheduled_date }
        volume: target number of posts to generate (default 5).
        """

    @abstractmethod
    async def generate_signals(self, band, posts: list) -> list[dict]:
        """
        Phase 2 — SEÑAL: Given approved StrategicPost objects (caption=None),
        return { id, caption, hashtags } per post.
        """

    @abstractmethod
    async def refine_post(self, band, original_caption: str, platform: str, feedback: str) -> dict:
        """Return a refined { caption, hashtags } given user feedback."""


# ─── Mock Planner ──────────────────────────────────────

class MockAIPlanner(BaseAIPlanner):
    """Deterministic mock for dev/test. No API key required."""

    async def generate_batch(self, band, events: list, timeframe: str, volume: int = 5) -> list[dict]:
        await self._simulate_latency()
        today = date.today()
        days = {"weekly": 7, "biweekly": 14, "monthly": 30}.get(timeframe, 7)
        posts = []

        for event in events:
            if not (today <= event.event_date <= today + timedelta(days=days)):
                continue

            delta = (event.event_date - today).days
            arch_key = "pre" if delta > 1 else ("day" if delta == 0 else "post")
            arch = CONCEPT_ARCHETYPES[arch_key]
            hashtag = event.title.replace(" ", "").replace("ó", "o")[:15]

            for platform in random.sample(PLATFORMS, k=2):
                posts.append({
                    "event_id": event.id,
                    "platform": platform,
                    "concept_title": f"{arch['title']} — {event.title}",
                    "narrative_goal": arch["goal"],
                    "caption": None,
                    "hashtags": [f"#{hashtag}", f"#{band.name.replace(' ', '')}"],
                    "scheduled_date": event.event_date,
                })

        # Neutral filler slots — fill up to `volume` total posts
        neutral_arch = CONCEPT_ARCHETYPES["neutral"]
        neutral_count = max(0, volume - len(posts))
        for i in range(neutral_count):
            platform = PLATFORMS[i % len(PLATFORMS)]
            scheduled = today + timedelta(days=random.randint(1, days))
            posts.append({
                "event_id": None,
                "platform": platform,
                "concept_title": neutral_arch["title"],
                "narrative_goal": neutral_arch["goal"],
                "caption": None,
                "hashtags": [f"#{band.name.replace(' ', '')}", "#Agenmatica"],
                "scheduled_date": scheduled,
            })

        return posts

    async def generate_signals(self, band, posts: list) -> list[dict]:
        """Generate captions for each approved concept post."""
        await self._simulate_latency()
        results = []
        for post in posts:
            arch_key = _infer_archetype(post.concept_title or "")
            caption_tpl = random.choice(SIGNAL_CAPTIONS[arch_key])
            # Fill template placeholders if present
            caption = caption_tpl.format(
                title=getattr(post, "concept_title", "el evento").split("—")[-1].strip(),
                date=post.scheduled_date.strftime("%d/%m") if post.scheduled_date else "pronto",
            )
            results.append({
                "id": post.id,
                "caption": caption,
                "hashtags": post.hashtags or [f"#{band.name.replace(' ', '')}"],
            })
        return results

    async def refine_post(self, band, original_caption: str, platform: str, feedback: str) -> dict:
        await self._simulate_latency()
        platform_tag = f"#{platform.capitalize()}" if platform else "#Refined"
        return {
            "caption": f"[Refinado: {feedback[:40]}...] {original_caption}",
            "hashtags": [f"#{band.name.replace(' ', '')}", platform_tag],
        }

    async def _simulate_latency(self):
        import asyncio
        await asyncio.sleep(random.uniform(0.2, 0.6))


# ─── Together.ai Planner ───────────────────────────────

class TogetherAIPlanner(BaseAIPlanner):
    """Real Strategist Agent using Together.ai (Llama 3). Two-phase pipeline."""

    SYSTEM_CONCEPTS = """Eres un Estratega de Contenido Senior especializado en música independiente.
Fase 1 (MAPA): dado el ADN de la banda y sus eventos próximos, propone un batch de CONCEPTOS estratégicos.
NO redactes captions ni textos largos. Solo ideas y objetivos narrativos.
Responde SIEMPRE con JSON válido: lista de objetos con campos:
  platform, concept_title, narrative_goal, scheduled_date (YYYY-MM-DD), event_id (int|null).
Sin texto adicional fuera del JSON."""

    SYSTEM_SIGNALS = """Eres un Copywriter creativo especializado en música independiente.
Fase 2 (SEÑAL): dado un concepto estratégico aprobado, redacta el caption final.
Responde SIEMPRE con JSON válido: lista de objetos con campos:
  id (int), caption (str), hashtags ([str]).
Sin texto adicional fuera del JSON."""

    def __init__(self):
        self.api_key = settings.together_api_key
        self.model = settings.together_model
        self.base_url = "https://api.together.ai/v1"

    def _band_context(self, band) -> str:
        return (
            f"MARCA: {band.name}\n"
            f"Género: {band.genre or 'Rock'}\n"
            f"Tono: {', '.join(band.tone_keywords or [])}\n"
            f"Audiencia: {band.audience_age_min}-{band.audience_age_max} años, {band.audience_country or 'Argentina'}\n"
            f"Modismos locales: {'Sí' if band.use_regional_slang else 'No'}"
        )

    async def generate_batch(self, band, events: list, timeframe: str, volume: int = 5) -> list[dict]:
        today = date.today()
        events_text = "\n".join(
            f"- [{e.id}] {e.title} ({e.category}) — {e.event_date}" for e in events
        ) or "Sin eventos próximos."
        prompt = (
            f"{self._band_context(band)}\n\n"
            f"TIMEFRAME: {timeframe} (desde {today})\n"
            f"VOLUMEN OBJETIVO: {volume} posts\n"
            f"EVENTOS:\n{events_text}\n\n"
            f"Genera exactamente {volume} conceptos estratégicos para el periodo. Mix de plataformas: instagram, facebook, tiktok, youtube."
        )
        raw = await self._call_llm(self.SYSTEM_CONCEPTS, prompt)
        parsed = self._parse_json_list(raw)
        # Ensure caption is always None in concept phase
        for p in parsed:
            p["caption"] = None
        return parsed

    async def generate_signals(self, band, posts: list) -> list[dict]:
        concepts_text = "\n".join(
            f"- id={p.id} | {p.platform} | {p.concept_title} | Goal: {p.narrative_goal}"
            for p in posts
        )
        prompt = (
            f"{self._band_context(band)}\n\n"
            f"CONCEPTOS APROBADOS:\n{concepts_text}\n\n"
            "Redacta el caption final para cada concepto. Respeta la voz de la marca."
        )
        raw = await self._call_llm(self.SYSTEM_SIGNALS, prompt)
        return self._parse_json_list(raw)

    async def refine_post(self, band, original_caption: str, platform: str, feedback: str) -> dict:
        prompt = (
            f"Post original para {platform}:\n\"{original_caption}\"\n\n"
            f"Feedback: \"{feedback}\"\n\n"
            f"Reescribe el post aplicando el feedback. Mantén la voz de {band.name}.\n"
            "Responde con JSON: {\"caption\": str, \"hashtags\": [str]}"
        )
        raw = await self._call_llm(self.SYSTEM_SIGNALS, prompt)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"caption": original_caption, "hashtags": []}

    async def _call_llm(self, system: str, user_prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": 2000,
            "temperature": 0.7,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    def _parse_json_list(self, raw: str) -> list:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            start, end = raw.find("["), raw.rfind("]") + 1
            return json.loads(raw[start:end]) if start != -1 else []


# ─── Volume → Timeframe mapping ────────────────────────

def volume_to_timeframe(volume: int) -> str:
    """
    Map a numeric post volume to a BatchTimeframe string for DB storage.
    5  → weekly  (7-day horizon)
    10 → biweekly (14-day horizon)
    15+ → monthly (30-day horizon)
    """
    if volume <= 5:
        return "weekly"
    elif volume <= 10:
        return "biweekly"
    return "monthly"


# ─── Factory ───────────────────────────────────────────

def get_ai_planner() -> BaseAIPlanner:
    if settings.mock_llm:
        return MockAIPlanner()
    return TogetherAIPlanner()
