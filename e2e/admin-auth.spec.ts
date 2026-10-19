import { test, expect } from '@playwright/test';

test.describe('Step 22: Admin Authentication & Protected Route Gate', () => {
  const obscureAdminPath = '/sk-11312301239';
  const obscureLoginPath = '/sk-11312301239/login';

  test('should redirect unauthenticated users from protected admin routes to login page', async ({ page }) => {
    // 1. Attempt to navigate directly to obscure admin dashboard
    await page.goto(obscureAdminPath);
    await page.waitForLoadState('domcontentloaded');

    // 2. Expect redirection to login page with 'from' parameter
    await expect(page).toHaveURL(new RegExp(`${obscureLoginPath}\\?from=`));
    await expect(page.getByRole('heading', { name: 'Ficco Admin Portal' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Masuk ke Admin Portal/i })).toBeVisible();

    // 3. Attempt alias /sk-11312301239/admin
    await page.goto(`${obscureAdminPath}/admin`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(new RegExp(`${obscureLoginPath}\\?from=`));
  });

  test('should reject invalid credentials and show error alert', async ({ page }) => {
    await page.goto(obscureLoginPath);
    await page.waitForLoadState('domcontentloaded');

    // 1. Submit empty form
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();
    await expect(page.getByText('Username wajib diisi')).toBeVisible();

    // 2. Submit wrong credentials
    await page.locator('#admin-username').fill('wrongadmin');
    await page.locator('#admin-password').fill('wrongpassword');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();

    // 3. Verify error message
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/Autentikasi Gagal|Username atau password salah/i)).toBeVisible();
  });

  test('should successfully authenticate with valid credentials and access protected dashboard', async ({ page }) => {
    await page.goto(obscureLoginPath);
    await page.waitForLoadState('domcontentloaded');

    // Fill valid credentials
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');

    // Submit
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(new RegExp(`${obscureAdminPath}$`));
    await expect(page.getByRole('heading', { name: 'Panel Kendali Lisensi Ficco' })).toBeVisible();

    // Verify admin header badges and navigation
    await expect(page.getByText('Super Admin')).toBeVisible();
    await expect(page.getByRole('banner').getByText('admin', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Logout/i }).first()).toBeVisible();

    // Visiting login page while authenticated should redirect back to dashboard
    await page.goto(obscureLoginPath);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(new RegExp(`${obscureAdminPath}$`));
  });

  test('should log out successfully and prevent access to protected dashboard', async ({ page }) => {
    // 1. First log in
    await page.goto(obscureLoginPath);
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();
    await expect(page).toHaveURL(new RegExp(`${obscureAdminPath}$`));

    // 2. Click logout
    await page.getByRole('button', { name: /Logout/i }).first().click();

    // 3. Verify redirected to login page
    await expect(page).toHaveURL(new RegExp(`${obscureLoginPath}$`));
    await expect(page.getByRole('button', { name: /Masuk ke Admin Portal/i })).toBeVisible();

    // 4. Try navigating back to dashboard -> should be redirected to login
    await page.goto(obscureAdminPath);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(new RegExp(`${obscureLoginPath}\\?from=`));
  });

  test('should verify admin secret credentials are never leaked to client window', async ({ page }) => {
    await page.goto(obscureLoginPath);
    await page.waitForLoadState('domcontentloaded');

    const clientLeak = await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const win = window as any;
      return {
        hasAdminPassword: Boolean(win.process?.env?.ADMIN_PASSWORD),
        hasAdminSecret: Boolean(win.process?.env?.ADMIN_SESSION_SECRET),
        hasWindowAdminPassword: Boolean(win.ADMIN_PASSWORD),
        hasWindowAdminSecret: Boolean(win.ADMIN_SESSION_SECRET),
      };
    });

    expect(clientLeak.hasAdminPassword).toBeFalsy();
    expect(clientLeak.hasAdminSecret).toBeFalsy();
    expect(clientLeak.hasWindowAdminPassword).toBeFalsy();
    expect(clientLeak.hasWindowAdminSecret).toBeFalsy();
  });

  test('should verify API endpoints /api/admin/login, /api/admin/me, and /api/admin/logout', async ({ request }) => {
    // 1. /api/admin/me without session
    const meRes1 = await request.get('/api/admin/me');
    expect(meRes1.ok()).toBeTruthy();
    const meJson1 = await meRes1.json();
    expect(meJson1.authenticated).toBe(false);

    // 2. /api/admin/login with invalid credentials -> 401
    const invalidLoginRes = await request.post('/api/admin/login', {
      data: { username: 'invalid', password: 'bad' },
    });
    expect(invalidLoginRes.status()).toBe(401);
    const invalidJson = await invalidLoginRes.json();
    expect(invalidJson.success).toBe(false);

    // 3. /api/admin/login with valid credentials -> 200 with Set-Cookie
    const validLoginRes = await request.post('/api/admin/login', {
      data: { username: 'admin', password: 'ficco-admin-2026' },
    });
    expect(validLoginRes.ok()).toBeTruthy();
    const validJson = await validLoginRes.json();
    expect(validJson.success).toBe(true);
    expect(validJson.user.username).toBe('admin');

    const cookies = validLoginRes.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies).toContain('ficco_admin_session=');
    expect(cookies).toContain('HttpOnly');

    // 4. /api/admin/logout
    const logoutRes = await request.post('/api/admin/logout');
    expect(logoutRes.ok()).toBeTruthy();
    const logoutJson = await logoutRes.json();
    expect(logoutJson.success).toBe(true);
  });
});
