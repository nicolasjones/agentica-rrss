"""
AGENMATICA - Pydantic Schemas
Request/Response models for the API.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ─── Auth ────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str = Field(..., example="nico@sientes.com")
    password: str = Field(..., min_length=8, example="securepass123")
    full_name: Optional[str] = Field(None, example="Nicolás Jones")


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Band ────────────────────────────────────────────

class BandCreate(BaseModel):
    name: str = Field(..., example="Sientes")
    genre: Optional[str] = Field(None, example="Rock Alternativo")
    audience_age_range: Optional[str] = Field(None, example="18-30")
    audience_location: Optional[str] = Field(None, example="CABA, Argentina")
    tone_keywords: Optional[list[str]] = Field(None, example=["sarcastic", "energetic"])
    values_keywords: Optional[list[str]] = Field(None, example=["authenticity", "DIY"])


class BandUpdate(BaseModel):
    name: Optional[str] = None
    genre: Optional[str] = None
    audience_age_range: Optional[str] = None
    audience_location: Optional[str] = None
    tone_keywords: Optional[list[str]] = None
    values_keywords: Optional[list[str]] = None
    auto_publish: Optional[bool] = None
    posts_per_day: Optional[int] = Field(None, ge=1, le=10)


class BandResponse(BaseModel):
    id: int
    name: str
    plan: str
    genre: Optional[str]
    audience_age_range: Optional[str]
    audience_location: Optional[str]
    tone_keywords: Optional[list[str]]
    values_keywords: Optional[list[str]]
    confidence_score: float
    auto_publish: bool
    posts_per_day: int
    created_at: datetime

    class Config:
        from_attributes = True


class BandProfileResponse(BaseModel):
    """Band profile with learning progress."""
    band: BandResponse
    confidence_score: float
    patterns_count: int
    posts_analyzed: int
    approval_rate: float
    learning_progress: str  # "learning", "proficient", "expert"


# ─── Network ─────────────────────────────────────────

class NetworkConnect(BaseModel):
    platform: str = Field(..., example="instagram")
    oauth_code: Optional[str] = None  # For OAuth flow


class NetworkResponse(BaseModel):
    id: int
    platform: str
    username: Optional[str]
    followers_count: int
    last_scan: Optional[datetime]
    content_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ScanStatusResponse(BaseModel):
    network_id: int
    status: str  # scanning, completed, failed
    posts_scanned: int
    patterns_discovered: int
    progress_percent: float


# ─── Generated Posts ─────────────────────────────────

class GeneratedPostResponse(BaseModel):
    id: int
    caption: str
    hashtags: Optional[list[str]]
    emoji_suggestions: Optional[str]
    cta: Optional[str]
    image_url: Optional[str]
    target_platform: str
    suggested_publish_time: Optional[datetime]
    status: str
    approval_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class PostApproveRequest(BaseModel):
    pass  # Just the action, no body needed


class PostEditRequest(BaseModel):
    edited_caption: str = Field(..., min_length=1)


class PostRejectRequest(BaseModel):
    reason: str = Field(..., min_length=5, example="Too corporate, doesn't sound like us")


class TodayPostsResponse(BaseModel):
    band_id: int
    band_name: str
    date: str
    posts: list[GeneratedPostResponse]
    approval_rate_current: float  # Current overall approval rate


# ─── Analytics ───────────────────────────────────────

class PlatformAnalytics(BaseModel):
    platform: str
    followers: int
    avg_likes: float
    avg_comments: float
    avg_views: Optional[float] = None
    engagement_rate: float
    top_content_type: str


class AnalyticsOverview(BaseModel):
    total_followers: int
    followers_growth_week: int
    followers_growth_percent: float
    total_engagement: int
    engagement_rate: float
    posts_published_week: int
    top_post_caption: Optional[str]
    top_post_likes: Optional[int]
    approval_rate: float
    confidence_score: float
    platform_breakdown: list[PlatformAnalytics] = []


# ─── Learning ────────────────────────────────────────

class LearningProgressResponse(BaseModel):
    band_id: int
    current_confidence: float
    approval_rate_history: list[dict]  # [{week: 1, rate: 0.68}, ...]
    patterns_discovered: int
    total_learning_events: int
    last_profile_update: Optional[datetime]
    status: str  # "learning", "proficient", "expert"


# ─── Campaigns ─────────────────────────────────────────

class CampaignCreate(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "New Album Launch"})
    description: Optional[str] = None
    objective: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class CampaignResponse(BaseModel):
    id: int
    band_id: int
    name: str
    description: Optional[str]
    objective: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ─── Generative Feedback ───────────────────────────────

class GenerativeFeedbackCreate(BaseModel):
    reason_code: str
    comment: Optional[str] = None

class GenerativeFeedbackResponse(BaseModel):
    id: int
    generated_post_id: int
    reason_code: str
    comment: Optional[str]
    impacted_vector_update: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ─── Common ──────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    pages: int

# ─── Band Members & Context ────────────────────────────

class BandMemberCreate(BaseModel):
    name: str
    role: str
    is_active: bool = True

class BandMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class BandMemberResponse(BaseModel):
    id: int
    band_id: int
    name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BandContextCreate(BaseModel):
    key: str
    value: str

class BandContextResponse(BaseModel):
    id: int
    band_id: int
    key: str
    value: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ─── Multi-Project / Workspace ────────────────────────

class BandOverviewResponse(BaseModel):
    id: int
    name: str
    followers_count: int
    pending_posts_count: int
    confidence_score: float
    platform_icons: list[str] = []

    model_config = ConfigDict(from_attributes=True)

class AggregatedAnalytics(BaseModel):
    total_followers: int
    total_engagement: int
    project_count: int
    avg_confidence: float
    global_growth_week: float
