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
const enabled = process.env.REGISTRATION_TEST_ENABLED === 'true';
const evidence = process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR;
// Run against a disposable testing database; enabled mode creates two users.
(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    try {
        for (const width of [1440, 390]) {
            const page = await browser.newPage({
                viewport: { width, height: 900 },
            });
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(origin + '/login');
            const signup = page.getByRole('link', {
                name: 'Sign up',
                exact: true,
            });
            if (enabled) {
                await signup.click();
                await page.waitForURL('**/register');
                await page
                    .getByRole('heading', {
                        name: 'Create your account',
                        exact: true,
                    })
                    .waitFor();
                assert.equal(
                    await page
                        .getByLabel('Email address')
                        .getAttribute('readonly'),
                    null,
                );
                assert(
                    await page
                        .getByLabel('Name', { exact: true })
                        .evaluate((input) => input === document.activeElement),
                );
                await page
                    .getByLabel('Name', { exact: true })
                    .fill('Public preview');
                await page
                    .getByLabel('Email address')
                    .fill(`public-${width}@example.test`);
                await page
                    .getByLabel('Password', { exact: true })
                    .fill('password');
                await page.getByLabel('Confirm password').fill('wrong');
                await page
                    .getByRole('button', {
                        name: 'Create account',
                        exact: true,
                    })
                    .click();
                await page
                    .getByText(
                        'The password field confirmation does not match.',
                    )
                    .waitFor();
                await page.getByLabel('Confirm password').fill('password');
            } else {
                assert.equal(await signup.count(), 0);
                const response = await page.request.get(origin + '/register');
                assert.equal(response.status(), 404);
                const xsrf = (await page.context().cookies(origin)).find(
                    (cookie) => cookie.name === 'XSRF-TOKEN',
                );
                assert(xsrf);
                const post = await page.request.post(origin + '/register', {
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(xsrf.value),
                        Origin: origin,
                    },
                    data: {
                        name: 'Uninvited',
                        email: 'blocked@example.test',
                        password: 'password',
                        password_confirmation: 'password',
                    },
                });
                assert.equal(post.status(), 422);
                assert((await post.json()).errors.invitation);
            }
            assert(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                ),
            );
            if (evidence) {
                fs.mkdirSync(evidence, { recursive: true });
                await page.screenshot({
                    path: path.join(
                        evidence,
                        `${enabled ? 'enabled' : 'disabled'}-${width}.png`,
                    ),
                    fullPage: true,
                    animations: 'disabled',
                });
            }
            if (enabled) {
                await page
                    .getByRole('button', {
                        name: 'Create account',
                        exact: true,
                    })
                    .click();
                await page.waitForURL('**/email/verify');
                await page
                    .getByRole('button', {
                        name: 'Resend verification email',
                        exact: true,
                    })
                    .waitFor();
                await page.goto(origin + '/messages');
                await page.waitForURL('**/email/verify');
            }
            await page.close();
        }
        assert.deepEqual(errors, []);
        console.log(
            `Registration flag ${enabled ? 'enabled' : 'disabled'} passed at 1440px/390px: conditional signup, server gate or creation/verification, keyboard focus, validation/retry, no overflow or page errors.`,
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
