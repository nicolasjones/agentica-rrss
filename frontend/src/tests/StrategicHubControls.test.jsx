/**
 * Unit tests — Strategic Hub Control Refinement
 * Validates contextual button labels, volume selector visibility, and safety guard.
 *
 * Strategy:  Pure logic + helper functions extracted from Planner.jsx.
 *            No API calls or routing needed.
 */

import { describe, it, expect } from 'vitest';

// ── Pure logic helpers (mirrored from Planner.jsx) ────────────────────────────

const VOLUMES = [
  { key: 5,  label: '5 posts' },
  { key: 10, label: '10 posts' },
  { key: 15, label: '15 posts' },
];

function deriveApprovedCount(batch) {
  return batch?.posts?.filter(p => p.is_approved).length || 0;
}

function getGenerateButtonLabel(hubMode, batch, approvedCount, hasSignals) {
  if (hubMode === 'production' && batch && hasSignals) {
    const total = batch?.posts?.length || 0;
    return `Publicar (${approvedCount}/${total})`;
  }
  if (hubMode === 'production' && batch && !hasSignals) {
    return `Generar Señales (${approvedCount})`;
  }
  return 'Generar Ideas';
}

function isGenerateButtonDisabled(hubMode, batch, approvedCount, generating, generatingSignals, approving) {
  if (hubMode === 'production' && batch && !batch.posts?.some(p => p.caption)) {
    return approvedCount === 0 || generatingSignals;
  }
  if (hubMode === 'production' && batch && batch.posts?.some(p => p.caption)) {
    return approvedCount === 0 || approving;
  }
  return generating;
}

function showVolumeSelector(hubMode) {
  return hubMode !== 'production';
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeBatch = (overrides = {}) => ({
  id: 1,
  status: 'proposed',
  posts: [],
  ...overrides,
});

const makePosts = (count, approved = 0, withCaption = false) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    platform: 'instagram',
    is_approved: i < approved,
    caption: withCaption ? `Caption ${i + 1}` : null,
    concept_title: `Concept ${i + 1}`,
    scheduled_date: null,
  }));

// ── T1: Button label — Strategy mode ─────────────────────────────────────────

describe('Button label — Strategy mode (MAPA)', () => {
  it('returns "Generar Ideas" when hubMode is strategy and no batch', () => {
    expect(getGenerateButtonLabel('strategy', null, 0, false)).toBe('Generar Ideas');
  });

  it('returns "Generar Ideas" when hubMode is strategy with an existing batch', () => {
    const batch = makeBatch({ posts: makePosts(5) });
    expect(getGenerateButtonLabel('strategy', batch, 0, false)).toBe('Generar Ideas');
  });
});

// ── T2: Button label — Production mode without signals ───────────────────────

describe('Button label — Production mode (Señal) before signal generation', () => {
  it('returns "Generar Señales (0)" when no posts are approved', () => {
    const batch = makeBatch({ posts: makePosts(5, 0) });
    expect(getGenerateButtonLabel('production', batch, 0, false)).toBe('Generar Señales (0)');
  });

  it('returns "Generar Señales (3)" when 3 posts are approved', () => {
    const batch = makeBatch({ posts: makePosts(5, 3) });
    const count = deriveApprovedCount(batch);
    expect(getGenerateButtonLabel('production', batch, count, false)).toBe('Generar Señales (3)');
  });

  it('returns "Generar Señales (5)" when all 5 posts are approved', () => {
    const batch = makeBatch({ posts: makePosts(5, 5) });
    const count = deriveApprovedCount(batch);
    expect(getGenerateButtonLabel('production', batch, count, false)).toBe('Generar Señales (5)');
  });
});

// ── T3: Button label — Production mode with signals (publish phase) ───────────

describe('Button label — Production mode after signal generation', () => {
  it('returns "Publicar (2/5)" when 2 of 5 posts are approved and have captions', () => {
    const batch = makeBatch({ posts: makePosts(5, 2, true) });
    const count = deriveApprovedCount(batch);
    const hasSignals = batch.posts.some(p => p.caption);
    expect(getGenerateButtonLabel('production', batch, count, hasSignals)).toBe('Publicar (2/5)');
  });
});

// ── T4: Safety guard — "Generar Señales" disabled when 0 approved ─────────────

describe('Safety guard — disabled state', () => {
  it('is disabled in production mode when approvedCount === 0 (no signals yet)', () => {
    const batch = makeBatch({ posts: makePosts(5, 0) });
    expect(isGenerateButtonDisabled('production', batch, 0, false, false, false)).toBe(true);
  });

  it('is NOT disabled in production mode when approvedCount > 0 (no signals yet)', () => {
    const batch = makeBatch({ posts: makePosts(5, 2) });
    expect(isGenerateButtonDisabled('production', batch, 2, false, false, false)).toBe(false);
  });

  it('is disabled in production mode when generatingSignals is true', () => {
    const batch = makeBatch({ posts: makePosts(5, 3) });
    expect(isGenerateButtonDisabled('production', batch, 3, false, true, false)).toBe(true);
  });

  it('is NOT disabled in strategy mode regardless of approvedCount', () => {
    const batch = makeBatch({ posts: makePosts(5, 0) });
    expect(isGenerateButtonDisabled('strategy', batch, 0, false, false, false)).toBe(false);
  });

  it('is disabled in strategy mode only when generating is true', () => {
    expect(isGenerateButtonDisabled('strategy', null, 0, true, false, false)).toBe(true);
  });
});

// ── T5: Volume selector visibility ───────────────────────────────────────────

describe('Volume selector visibility', () => {
  it('is visible in strategy mode (MAPA)', () => {
    expect(showVolumeSelector('strategy')).toBe(true);
  });

  it('is hidden in production mode (SEÑAL)', () => {
    expect(showVolumeSelector('production')).toBe(false);
  });
});

// ── T6: Volume options ────────────────────────────────────────────────────────

describe('Volume selector options', () => {
  it('contains exactly the values 5, 10, 15', () => {
    const keys = VOLUMES.map(v => v.key);
    expect(keys).toEqual([5, 10, 15]);
  });

  it('labels are formatted as "[n] posts"', () => {
    VOLUMES.forEach(v => {
      expect(v.label).toBe(`${v.key} posts`);
    });
  });
});

// ── T7: approvedCount derivation ──────────────────────────────────────────────

describe('approvedCount derivation', () => {
  it('returns 0 for null batch', () => {
    expect(deriveApprovedCount(null)).toBe(0);
  });

  it('returns 0 for batch with empty posts', () => {
    expect(deriveApprovedCount(makeBatch({ posts: [] }))).toBe(0);
  });

  it('counts only approved posts', () => {
    const batch = makeBatch({ posts: makePosts(10, 4) });
    expect(deriveApprovedCount(batch)).toBe(4);
  });

  it('updates in real-time as approvals change', () => {
    const posts = makePosts(3, 0);
    const batch = makeBatch({ posts });

    // Approve first post (immutable update)
    const updatedBatch = {
      ...batch,
      posts: batch.posts.map(p => p.id === 1 ? { ...p, is_approved: true } : p),
    };
    expect(deriveApprovedCount(updatedBatch)).toBe(1);
  });
});
