/**
 * AGENMATICA — T15: E2E Test — Post Lab: Idea → Signal Flow
 * Tests the complete strategic pipeline from concept generation to signal publishing.
 *
 * Preconditions:
 *   - App is running on http://localhost:5173
 *   - User is logged in and has an active band
 *   - Backend mock mode (MOCK_LLM=true) is enabled for deterministic responses
 */

import { test, expect } from '@playwright/test';

// ─── Auth helpers ──────────────────────────────────────────────────────────────

async function loginAs(page, email = 'test@example.com', password = 'password123') {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/planner', { timeout: 10000 });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe('Post Lab — Idea → Signal Pipeline', () => {

  test.beforeEach(async ({ page }) => {
    // Attempt login; skip auth if already authenticated (cookie reuse)
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    if (!token) {
      await loginAs(page);
    } else {
      await page.goto('/planner');
    }
    // Wait for the Post Lab to load
    await page.waitForSelector('[data-testid="hub-controller"]', { timeout: 15000 });
  });

  // ── Phase 1: MAPA mode ────────────────────────────────────────────────────

  test('T15-01: Hub Controller renders MAPA/SEÑAL + CAL/LISTA switches', async ({ page }) => {
    const mapaBtn = page.locator('[data-testid="hub-mode-mapa"]');
    const senalBtn = page.locator('[data-testid="hub-mode-senal"]');
    const calBtn   = page.locator('[data-testid="view-calendar"]');
    const listaBtn = page.locator('[data-testid="view-list"]');

    await expect(mapaBtn).toBeVisible();
    await expect(senalBtn).toBeVisible();
    await expect(calBtn).toBeVisible();
    await expect(listaBtn).toBeVisible();
  });

  test('T15-02: Volume selector shows 5/10/15 options', async ({ page }) => {
    const volumeSelect = page.locator('[data-testid="volume-selector"]');
    await expect(volumeSelect).toBeVisible();

    const options = await volumeSelect.locator('option').allTextContents();
    expect(options).toContain('5 posts');
    expect(options).toContain('10 posts');
    expect(options).toContain('15 posts');
  });

  test('T15-03: Generate Batch creates concepts in MAPA mode', async ({ page }) => {
    // Ensure MAPA mode
    await page.click('[data-testid="hub-mode-mapa"]');

    // Select volume 5
    await page.selectOption('[data-testid="volume-selector"]', '5');

    // Click generate
    const generateBtn = page.locator('[data-testid="generate-btn"]');
    await generateBtn.click();

    // Wait for loading to finish
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Switch to list view to see concepts
    await page.click('[data-testid="view-list"]');

    // Should show concept rows (ConceptList)
    const conceptRows = page.locator('[data-testid="concept-row"]');
    await expect(conceptRows.first()).toBeVisible({ timeout: 10000 });

    const count = await conceptRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(5);
  });

  test('T15-04: Approve a concept in MAPA list view', async ({ page }) => {
    // Navigate to MAPA list
    await page.click('[data-testid="hub-mode-mapa"]');
    await page.click('[data-testid="view-list"]');

    // Wait for concepts to be visible
    const firstRow = page.locator('[data-testid="concept-row"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Hover to reveal action buttons
    await firstRow.hover();

    // Click approve button
    const approveBtn = firstRow.locator('[data-testid="approve-btn"]');
    await approveBtn.click();

    // Badge should show "Accepted"
    const acceptedBadge = firstRow.locator('text=Accepted');
    await expect(acceptedBadge).toBeVisible();
  });

  // ── Phase 2: SEÑAL mode ───────────────────────────────────────────────────

  test('T15-05: Switch to SEÑAL mode shows signal-specific UI', async ({ page }) => {
    await page.click('[data-testid="hub-mode-senal"]');

    // The status label should reflect SEÑAL mode
    const statusLabel = page.locator('[data-testid="hub-status-label"]');
    await expect(statusLabel).toContainText('Señal');
  });

  test('T15-06: Generate Signals button is disabled with 0 approved concepts', async ({ page }) => {
    // Generate a fresh batch in MAPA mode
    await page.click('[data-testid="hub-mode-mapa"]');
    const generateBtn = page.locator('[data-testid="generate-btn"]');
    await generateBtn.click();
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Switch to SEÑAL before approving anything
    await page.click('[data-testid="hub-mode-senal"]');

    const senalBtn = page.locator('[data-testid="generate-btn"]');
    await expect(senalBtn).toBeDisabled();
  });

  test('T15-07: Generate Signals creates captions for approved concepts', async ({ page }) => {
    // Generate batch
    await page.click('[data-testid="hub-mode-mapa"]');
    await page.selectOption('[data-testid="volume-selector"]', '5');

    const generateBtn = page.locator('[data-testid="generate-btn"]');
    await generateBtn.click();
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Approve first concept
    await page.click('[data-testid="view-list"]');
    const firstRow = page.locator('[data-testid="concept-row"]').first();
    await firstRow.hover();
    await firstRow.locator('[data-testid="approve-btn"]').click();
    await expect(firstRow.locator('text=Accepted')).toBeVisible();

    // Switch to SEÑAL and generate signals
    await page.click('[data-testid="hub-mode-senal"]');
    const senalGenerateBtn = page.locator('[data-testid="generate-btn"]');
    await expect(senalGenerateBtn).not.toBeDisabled();
    await senalGenerateBtn.click();

    // Wait for signal generation
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Signal feed should now show captions
    const signalRows = page.locator('[data-testid="signal-row"]');
    await expect(signalRows.first()).toBeVisible({ timeout: 10000 });
  });

  // ── Control Refinement: Dynamic button labels ─────────────────────────────

  test('CR-01: Generate button says "Generar Ideas" in MAPA mode', async ({ page }) => {
    await page.click('[data-testid="hub-mode-mapa"]');
    const btn = page.locator('[data-testid="generate-btn"]');
    await expect(btn).toContainText('Generar Ideas');
  });

  test('CR-02: Volume selector is visible in MAPA mode', async ({ page }) => {
    await page.click('[data-testid="hub-mode-mapa"]');
    await expect(page.locator('[data-testid="volume-selector"]')).toBeVisible();
  });

  test('CR-03: Volume selector is hidden in SEÑAL mode', async ({ page }) => {
    await page.click('[data-testid="hub-mode-senal"]');
    await expect(page.locator('[data-testid="volume-selector"]')).not.toBeVisible();
  });

  test('CR-04: Generate button says "Generar Señales (N)" in SEÑAL mode with batch', async ({ page }) => {
    // Generate a batch first
    await page.click('[data-testid="hub-mode-mapa"]');
    await page.locator('[data-testid="generate-btn"]').click();
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Switch to SEÑAL
    await page.click('[data-testid="hub-mode-senal"]');

    const btn = page.locator('[data-testid="generate-btn"]');
    await expect(btn).toContainText('Generar Señales');
  });

  test('CR-05: Generar Señales button shows correct count after approving concepts', async ({ page }) => {
    // Generate batch
    await page.click('[data-testid="hub-mode-mapa"]');
    await page.locator('[data-testid="generate-btn"]').click();
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Approve 2 concepts
    await page.click('[data-testid="view-list"]');
    const rows = page.locator('[data-testid="concept-row"]');
    for (let i = 0; i < 2; i++) {
      const row = rows.nth(i);
      await row.hover();
      await row.locator('[data-testid="approve-btn"]').click();
    }

    // Switch to SEÑAL and verify count in button
    await page.click('[data-testid="hub-mode-senal"]');
    const btn = page.locator('[data-testid="generate-btn"]');
    await expect(btn).toContainText('Generar Señales (2)');
  });

  // ── DnD (T11 via E2E) ─────────────────────────────────────────────────────

  test('T11-E2E: Dragging a concept to a new calendar cell updates its date', async ({ page }) => {
    // Generate concepts first
    await page.click('[data-testid="hub-mode-mapa"]');
    const generateBtn = page.locator('[data-testid="generate-btn"]');
    await generateBtn.click();
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Switch to calendar view
    await page.click('[data-testid="view-calendar"]');

    // Find a draggable chip — first visible post chip
    const chip = page.locator('[data-testid="draggable-post"]').first();
    const isVisible = await chip.isVisible().catch(() => false);

    if (!isVisible) {
      // If no chips visible, skip drag test (batch may have no scheduled dates in current month)
      test.skip();
      return;
    }

    // Get source cell
    const sourceBox = await chip.boundingBox();

    // Find a different droppable cell to drag to
    const targetCell = page.locator('[data-testid="calendar-cell"]').nth(5);
    const targetBox = await targetCell.boundingBox();

    if (!sourceBox || !targetBox) {
      test.skip();
      return;
    }

    // Perform drag
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.mouse.up();

    // Post should appear in the new cell
    await expect(targetCell.locator('[data-testid="draggable-post"]')).toBeVisible({ timeout: 5000 });
  });

  // ── View sync (T12 via E2E) ───────────────────────────────────────────────

  test('T12-E2E: Calendar and list views show the same total count of concepts', async ({ page }) => {
    // Generate a batch
    await page.click('[data-testid="hub-mode-mapa"]');
    await page.selectOption('[data-testid="volume-selector"]', '5');

    const generateBtn = page.locator('[data-testid="generate-btn"]');
    await generateBtn.click();
    await page.waitForSelector('[data-testid="generate-btn"]:not([disabled])', { timeout: 30000 });

    // Count chips in calendar
    await page.click('[data-testid="view-calendar"]');
    const calendarChips = page.locator('[data-testid="draggable-post"]');
    const calCount = await calendarChips.count();

    // Switch to list view
    await page.click('[data-testid="view-list"]');
    const listRows = page.locator('[data-testid="concept-row"]');
    const listCount = await listRows.count();

    // Both views must reflect the same number of posts
    expect(listCount).toBe(calCount);
  });

});
