"""
AGENMATICA - Database Models
Based on documented schema: bands, networks, content_posts,
content_patterns, learning_log, band_profile_evolution.
"""

from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Index, Enum, JSON,
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.db.session import Base
from app.core.config import get_settings

settings = get_settings()


# ─── Enums ───────────────────────────────────────────

class PlanType(str, PyEnum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class PlatformType(str, PyEnum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    SPOTIFY = "spotify"


class PostStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    EDITED = "edited"
    REJECTED = "rejected"
    PUBLISHED = "published"
    FAILED = "failed"


class PatternStatus(str, PyEnum):
    ACTIVE = "active"
    DEPRECATED = "deprecated"


class LearningEventType(str, PyEnum):
    POST_APPROVED = "post_approved"
    POST_EDITED = "post_edited"
    POST_REJECTED = "post_rejected"
    PATTERN_DISCOVERED = "pattern_discovered"
    PROFILE_UPDATED = "profile_updated"
    ENGAGEMENT_ANALYZED = "engagement_analyzed"


class RejectionReasonCode(str, PyEnum):
    TOO_CORPORATE = "too_corporate"
    WRONG_TONE = "wrong_tone"
    INACCURATE_GENRE = "inaccurate_genre"
    BAD_IMAGE = "bad_image"
    POOR_CTA = "poor_cta"
    OTHER = "other"


# ─── Utility ─────────────────────────────────────────

def utcnow():
    return datetime.now(timezone.utc)


# ─── Models ──────────────────────────────────────────

class User(Base):
    """Auth user (can manage one or more bands)."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    bands = relationship("Band", back_populates="owner")


class Band(Base):
    """Core entity: a rock band using AGENMATICA."""
    __tablename__ = "bands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    plan = Column(Enum(PlanType), default=PlanType.STARTER)
    genre = Column(String(100))
    audience_age_range = Column(String(50))  # e.g., "18-30"
    audience_location = Column(String(255))  # e.g., "CABA, Argentina"
    tone_keywords = Column(JSON)  # ["sarcastic", "energetic", "anti-corporate"]
    values_keywords = Column(JSON)  # ["authenticity", "DIY", "community"]

    # Band Profile (vector embedding)
    band_profile_vector = Column(Vector(settings.embedding_dimensions), nullable=True)
    confidence_score = Column(Float, default=0.0)  # 0.0 - 1.0

    # Config
    auto_publish = Column(Boolean, default=False)
    posts_per_day = Column(Integer, default=5)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    owner = relationship("User", back_populates="bands")
    networks = relationship("Network", back_populates="band", cascade="all, delete-orphan")
    generated_posts = relationship("GeneratedPost", back_populates="band", cascade="all, delete-orphan")
    content_patterns = relationship("ContentPattern", back_populates="band", cascade="all, delete-orphan")
    learning_logs = relationship("LearningLog", back_populates="band", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="band", cascade="all, delete-orphan")
    profile_snapshots = relationship("BandProfileEvolution", back_populates="band", cascade="all, delete-orphan")


class Network(Base):
    """Connected social network for a band."""
    __tablename__ = "networks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    platform = Column(Enum(PlatformType), nullable=False)
    oauth_token = Column(Text)  # Encrypted in production
    oauth_refresh_token = Column(Text)
    oauth_expires_at = Column(DateTime(timezone=True))
    external_user_id = Column(String(255))  # Platform-specific user/page ID
    username = Column(String(255))
    followers_count = Column(Integer, default=0)
    last_scan = Column(DateTime(timezone=True))
    content_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    band = relationship("Band", back_populates="networks")
    scanned_posts = relationship("ContentPost", back_populates="network", cascade="all, delete-orphan")


class ContentPost(Base):
    """Historical post scraped from a band's social network."""
    __tablename__ = "content_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    network_id = Column(Integer, ForeignKey("networks.id"), nullable=False)
    platform_post_id = Column(String(255))  # ID on the platform
    caption = Column(Text)
    media_type = Column(String(50))  # image, video, carousel, text
    media_url = Column(Text)
    published_at = Column(DateTime(timezone=True))
    permalink = Column(Text)

    # Engagement data (JSONB)
    engagement_data = Column(JSON)  # {likes, comments, shares, saves, views}
    performance_score = Column(Float)  # Normalized 0-1

    # LLM analysis (JSONB)
    tone_analysis = Column(JSON)  # {tone, sentiment, keywords, themes}

    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    network = relationship("Network", back_populates="scanned_posts")

    __table_args__ = (
        Index("idx_content_posts_network", "network_id"),
        Index("idx_content_posts_performance", "performance_score"),
        Index("idx_content_posts_published", "published_at"),
    )


class GeneratedPost(Base):
    """AI-generated post for a band."""
    __tablename__ = "generated_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    target_platform = Column(Enum(PlatformType), nullable=False)

    # Content
    caption = Column(Text, nullable=False)
    hashtags = Column(JSON)  # ["#RockAlternativo", "#NicetoClub"]
    emoji_suggestions = Column(String(100))
    cta = Column(String(255))  # Call to action
    image_url = Column(Text)  # Generated image URL (if any)
    image_prompt = Column(Text)  # Prompt used for image generation

    # Scheduling
    suggested_publish_time = Column(DateTime(timezone=True))
    actual_publish_time = Column(DateTime(timezone=True))

    # Status & feedback
    status = Column(Enum(PostStatus), default=PostStatus.PENDING)
    approval_score = Column(Float)  # Model's confidence this will be approved (0-1)
    rejection_reason = Column(Text)  # If rejected, why
    edited_caption = Column(Text)  # If edited, the new version

    # Prompt used (for debugging/learning)
    prompt_used = Column(Text)
    model_used = Column(String(100))
    generation_time_ms = Column(Integer)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))

    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    band = relationship("Band", back_populates="generated_posts")
    campaign = relationship("Campaign", back_populates="posts")
    feedbacks = relationship("GenerativeFeedback", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_generated_posts_band_status", "band_id", "status"),
        Index("idx_generated_posts_created", "created_at"),
    )


class ContentPattern(Base):
    """Discovered content pattern for a band."""
    __tablename__ = "content_patterns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    pattern_type = Column(String(50))  # content_type, timing, audience, theme
    pattern_name = Column(String(255))  # e.g., "Shows perform 3.5x better"
    pattern_data = Column(JSON)  # Detailed pattern info
    avg_performance = Column(Float)
    confidence = Column(Float)
    status = Column(Enum(PatternStatus), default=PatternStatus.ACTIVE)
    discovered_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    band = relationship("Band", back_populates="content_patterns")


class LearningLog(Base):
    """Every learning event in the system."""
    __tablename__ = "learning_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    event_type = Column(Enum(LearningEventType), nullable=False)
    data = Column(JSON)  # Event-specific data
    impact_score = Column(Float)  # How much this event affected the model
    timestamp = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    band = relationship("Band", back_populates="learning_logs")

    __table_args__ = (
        Index("idx_learning_log_band_time", "band_id", "timestamp"),
    )


class BandProfileEvolution(Base):
    """Monthly snapshots of a band's profile vector."""
    __tablename__ = "band_profile_evolution"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    snapshot_date = Column(DateTime(timezone=True), default=utcnow)
    profile_vector = Column(Vector(settings.embedding_dimensions))
    confidence_score = Column(Float)
    patterns_count = Column(Integer, default=0)
    posts_analyzed = Column(Integer, default=0)
    approval_rate = Column(Float)

    # Relationships
    band = relationship("Band", back_populates="profile_snapshots")
class Campaign(Base):
    """A multi-post strategic campaign (e.g., 'New Single Release')."""
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    objective = Column(String(255))
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    band = relationship("Band", back_populates="campaigns")
    posts = relationship("GeneratedPost", back_populates="campaign")


class GenerativeFeedback(Base):
    """Detailed feedback on AI-generated content for learning. (Semantic Loop)"""
    __tablename__ = "generative_feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    generated_post_id = Column(Integer, ForeignKey("generated_posts.id"), nullable=False)
    reason_code = Column(Enum(RejectionReasonCode), nullable=False)
    comment = Column(Text)
    impacted_vector_update = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    post = relationship("GeneratedPost", back_populates="feedbacks")


class InteractionResponse(Base):
    """Responses to DMs or comments generated by the Community Agent."""
    __tablename__ = "interaction_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    platform = Column(Enum(PlatformType), nullable=False)
    external_interaction_id = Column(String(255), nullable=False) # ID of the comment/DM
    interaction_type = Column(String(50)) # "comment" or "dm"
    incoming_text = Column(Text)
    response_text = Column(Text, nullable=False)
    
    # Status
    is_sent = Column(Boolean, default=False)
    needs_review = Column(Boolean, default=False)
    sentiment_score = Column(Float)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    
    __table_args__ = (
        Index("idx_interaction_band_ext", "band_id", "external_interaction_id"),
    )


class VisualStyle(Base):
    """Presets and learned visual styles for the Art Director."""
    __tablename__ = "visual_styles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    name = Column(String(100), nullable=False)
    
    # Artistic parameters
    description = Column(Text)
    color_palette = Column(JSON) # ["#000000", "#FFFFFF"]
    lighting_style = Column(String(100)) # "dramatic", "natural", "neon"
    composition_rules = Column(JSON) # ["close-up", "minimalist"]
    
    # Reference image URL for the agent
    reference_image_url = Column(Text)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)


class BandMember(Base):
    """Members of a band/identity (e.g., manager, producer, artist)."""
    __tablename__ = "band_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(100))  # manager, artist, producer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    band = relationship("Band", backref="members")


class BandContext(Base):
    """Arbitrary context keys for the agent (e.g., 'Next Show Date')."""
    __tablename__ = "band_contexts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    key = Column(String(100), nullable=False)
    value = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    band = relationship("Band", backref="contexts")
