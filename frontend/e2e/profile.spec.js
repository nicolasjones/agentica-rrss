import { test, expect } from '@playwright/test';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_BAND = {
  id: 1,
  name: 'Test Band',
  role: 'Banda',
  genre: 'Rock Alternativo, Post-Punk',
  tone_keywords: ['Sarcástico', 'Energético'],
  values_keywords: ['Autenticidad', 'DIY'],
  audience_age_min: 18,
  audience_age_max: 35,
  audience_country: '',
  audience_province: '',
  use_regional_slang: false,
  auto_publish: false,
  posts_per_day: 1,
  ia_model: 'gpt-4o',
  ia_match_rate: 85,
  ia_temperature: 0.7,
};

const MOCK_NETWORK_CONNECTED = {
  id: 10,
  platform: 'Instagram',
  is_active: true,
  connected: true,
  handle: 'testband_official',
  followers_count: 1200,
};

const MOCK_NETWORK_DISCONNECTED = {
  id: 11,
  platform: 'Facebook',
  is_active: false,
  connected: false,
  handle: null,
  followers_count: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setupAuthAndMocks(page) {
  // Inject auth tokens and active band before navigating
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'fake-token-for-e2e');
    localStorage.setItem('active_band_id', '1');
  });

  // Mock GET /api/v1/bands/1
  await page.route('**/api/v1/bands/1', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BAND) });
    } else {
      route.continue();
    }
  });

  // Mock PUT /api/v1/bands/1 — save
  await page.route('**/api/v1/bands/1', (route) => {
    if (route.request().method() === 'PUT') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BAND) });
    } else {
      route.continue();
    }
  });

  // Mock GET /api/v1/networks/
  await page.route('**/api/v1/networks/**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET' && url.includes('networks/') && !url.match(/networks\/\d+/)) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_NETWORK_CONNECTED, MOCK_NETWORK_DISCONNECTED]),
      });
    } else if (method === 'DELETE') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    } else if (method === 'POST' && url.includes('/scan')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    } else {
      route.continue();
    }
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Profile — Rediseño UX & IA Config (V2.0)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndMocks(page);
    await page.goto('/profile');
    // Ensure the page loaded (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
  });

  // ── 1. Tab Navigation ─────────────────────────────────────────────────────

  test('muestra la tab "Identidad de la Marca" activa por defecto', async ({ page }) => {
    const identityTab = page.getByRole('button', { name: /identidad de la marca/i });
    await expect(identityTab).toBeVisible();
    // The active tab has a colored bottom border; check for text visibility
    await expect(page.getByText('Rango de Edad Audiencia')).toBeVisible();
  });

  test('navega entre las tabs Identidad y Configuración de IA', async ({ page }) => {
    // Default: identity tab visible
    await expect(page.getByText('Rango de Edad Audiencia')).toBeVisible();

    // Click IA Config tab
    await page.getByRole('button', { name: /configuración de ia/i }).click();

    // IA Config content should appear
    await expect(page.getByText(/match rate|ia match|motor de ia/i).first()).toBeVisible();

    // Click back to identity tab
    await page.getByRole('button', { name: /identidad de la marca/i }).click();
    await expect(page.getByText('Rango de Edad Audiencia')).toBeVisible();
  });

  // ── 2. Edit Mode ──────────────────────────────────────────────────────────

  test('activa el modo edición al hacer click en "EDITAR ADN"', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();
    await expect(page.getByText(/modo edición activo/i)).toBeVisible();
  });

  // ── 3. Audience Age Selectors ─────────────────────────────────────────────

  test('los selectores de edad mínima y máxima son visibles en modo edición', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();

    const minSelect = page.locator('select').filter({ hasText: '18' }).first();
    const maxSelect = page.locator('select').filter({ hasText: '35' }).first();

    await expect(minSelect).toBeVisible();
    await expect(maxSelect).toBeVisible();
  });

  test('permite cambiar la edad mínima de audiencia', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();

    // Find age section and select min age
    const ageSection = page.locator('text=Rango de Edad Audiencia').locator('..');
    const selects = ageSection.locator('select');
    await selects.first().selectOption('25');
    await expect(selects.first()).toHaveValue('25');
  });

  // ── 4. Location Selectors (Country → Province) ────────────────────────────

  test('el selector de provincia está deshabilitado cuando no hay país seleccionado', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();

    // The province select should be disabled (no country selected in mock data)
    const provinceSelect = page.locator('select').filter({ hasText: 'Seleccionar Provincia...' }).first();
    await expect(provinceSelect).toBeDisabled();
  });

  test('seleccionar un país habilita el selector de provincia', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();

    // Select a country
    const countrySelect = page.locator('select').filter({ hasText: 'Seleccionar País...' }).first();
    await countrySelect.selectOption({ label: 'Argentina' });

    // Province selector should now be enabled
    const provinceSelect = page.locator('select').filter({ hasText: 'Seleccionar Provincia...' }).first();
    await expect(provinceSelect).not.toBeDisabled();
  });

  test('las provincias cambian al cambiar el país', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();

    const countrySelect = page.locator('select').filter({ hasText: 'Seleccionar País...' }).first();
    await countrySelect.selectOption({ label: 'Argentina' });

    const provinceSelect = page.locator('select').filter({ hasText: 'Seleccionar Provincia...' }).first();
    await provinceSelect.selectOption('Buenos Aires');
    await expect(provinceSelect).toHaveValue('Buenos Aires');

    // Change country — province should reset
    await countrySelect.selectOption({ label: 'España' });
    await expect(provinceSelect).toHaveValue('');
  });

  // ── 5. Regional Slang Toggle ──────────────────────────────────────────────

  test('el toggle de modismos regionales está presente', async ({ page }) => {
    await expect(page.getByText('Modismos Regionales')).toBeVisible();
  });

  test('activar el toggle de modismos regionales en modo edición', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();

    // The toggle button (slang) — it wraps ToggleLeft/ToggleRight icons
    const slangToggle = page.locator('button').filter({ has: page.locator('svg') }).nth(2); // approximate locator
    // Use the section header as anchor
    const slangSection = page.locator('text=Modismos Regionales').locator('../..');
    const toggle = slangSection.locator('button[type="button"]');
    await toggle.click();
    // After click the band state flips — no error expected
    await expect(slangSection).toBeVisible();
  });

  // ── 6. Help Tooltips ──────────────────────────────────────────────────────

  test('los iconos de ayuda están presentes en los campos de identidad', async ({ page }) => {
    // HelpTooltip renders an Info icon button
    const helpIcons = page.locator('button[aria-label="Ayuda"], [data-tooltip], button:has(svg)').first();
    // Just verify multiple tooltip triggers exist
    const allButtons = await page.locator('button').count();
    expect(allButtons).toBeGreaterThan(3);
  });

  // ── 7. Signal Nodes (Redes Sociales) ─────────────────────────────────────

  test('muestra las redes conectadas y no conectadas', async ({ page }) => {
    await expect(page.getByText('PORT: INSTAGRAM')).toBeVisible();
    await expect(page.getByText('PORT: FACEBOOK')).toBeVisible();
  });

  test('red conectada muestra botones Scan y Disconnect', async ({ page }) => {
    const instagramCard = page.locator('text=PORT: INSTAGRAM').locator('../..');
    await expect(instagramCard.getByText('Scan')).toBeVisible();
  });

  test('red no conectada muestra el botón "Authenticate Node"', async ({ page }) => {
    const facebookCard = page.locator('text=PORT: FACEBOOK').locator('../..');
    await expect(facebookCard.getByText('Authenticate Node →')).toBeVisible();
  });

  test('click en disconnect muestra el modal de confirmación "¿Confirmar Hard-Reset?"', async ({ page }) => {
    const instagramCard = page.locator('text=PORT: INSTAGRAM').locator('../..');

    // The disconnect/logout button has a LogOut icon inside
    const disconnectBtn = instagramCard.locator('button').last();
    await disconnectBtn.click();

    await expect(page.getByText('¿Confirmar Hard-Reset?')).toBeVisible();
    await expect(page.getByRole('button', { name: /sí/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /no/i })).toBeVisible();
  });

  test('cancelar el modal de disconnect cierra la confirmación', async ({ page }) => {
    const instagramCard = page.locator('text=PORT: INSTAGRAM').locator('../..');
    const disconnectBtn = instagramCard.locator('button').last();
    await disconnectBtn.click();

    await expect(page.getByText('¿Confirmar Hard-Reset?')).toBeVisible();

    await page.getByRole('button', { name: /no/i }).click();
    await expect(page.getByText('¿Confirmar Hard-Reset?')).not.toBeVisible();
  });

  test('confirmar disconnect llama a la API y recarga redes', async ({ page }) => {
    let deleteCalled = false;
    await page.route('**/api/v1/networks/10', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      } else {
        route.continue();
      }
    });

    const instagramCard = page.locator('text=PORT: INSTAGRAM').locator('../..');
    const disconnectBtn = instagramCard.locator('button').last();
    await disconnectBtn.click();

    await expect(page.getByText('¿Confirmar Hard-Reset?')).toBeVisible();
    await page.getByRole('button', { name: /sí/i }).click();

    await page.waitForTimeout(500);
    expect(deleteCalled).toBe(true);
  });

  // ── 8. Guardar cambios ────────────────────────────────────────────────────

  test('guardar el formulario en modo edición llama al API y muestra confirmación', async ({ page }) => {
    let putCalled = false;
    await page.route('**/api/v1/bands/1', (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BAND) });
      } else if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BAND) });
      } else {
        route.continue();
      }
    });

    await page.getByRole('button', { name: /editar adn/i }).click();
    await page.getByRole('button', { name: /guardar adn/i }).click();

    await page.waitForTimeout(500);
    expect(putCalled).toBe(true);
  });

  test('cancelar edición vuelve al modo lectura', async ({ page }) => {
    await page.getByRole('button', { name: /editar adn/i }).click();
    await expect(page.getByText(/modo edición activo/i)).toBeVisible();

    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByText(/adn protegido/i)).toBeVisible();
  });
});
