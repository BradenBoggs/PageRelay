const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const browserRequire = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/tmp/pilot-browser/package.json',
);
const { chromium } = browserRequire('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://localhost:8000';
const evidence = process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR;

(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    try {
        for (const width of [1440, 390]) {
            const page = await browser.newPage({
                viewport: { width, height: 900 },
            });
            page.on('pageerror', (error) => errors.push(error.message));
            for (const destination of ['/', '/login']) {
                const response = await page.goto(origin + destination);
                assert.equal(response.status(), 200);
                assert.equal(new URL(page.url()).pathname, '/login');
                await page.waitForLoadState('networkidle');
                assert.equal(
                    await page.locator('a[href*="/register"]').count(),
                    0,
                );
                assert.equal(
                    await page.getByText('Sign up', { exact: true }).count(),
                    0,
                );
            }
            await page.getByLabel('Email address').focus();
            await page.keyboard.press('Tab');
            await page.getByLabel('Password', { exact: true }).waitFor();
            assert.equal(
                await page
                    .getByLabel('Password', { exact: true })
                    .evaluate((input) => input === document.activeElement),
                true,
            );
            assert.equal(
                await page
                    .getByRole('button', { name: 'Log in', exact: true })
                    .isVisible(),
                true,
            );
            assert.equal(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth,
                ),
                true,
            );
            if (evidence) {
                fs.mkdirSync(evidence, { recursive: true });
                await page.screenshot({
                    path: path.join(evidence, `login-${width}.png`),
                    fullPage: true,
                });
            }
            await page.getByRole('link', { name: 'Forgot password?' }).click();
            await page.waitForURL('**/forgot-password');
            assert.equal(
                await page.getByLabel('Email address').isVisible(),
                true,
            );
            const registration = await page.goto(origin + '/register');
            assert.equal(registration.status(), 404);
            await page.close();
        }
        assert.deepEqual(errors, []);
        console.log(
            'Closed registration browser checks passed at 1440px and 390px: signup absent, login/password recovery and keyboard focus available, /register returns 404.',
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
