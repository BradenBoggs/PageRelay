const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-edit-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18019';
const identity = JSON.parse(
    fs.readFileSync(
        process.env.SIDEWIRE_BADGE_IDENTITY ||
            '/private/tmp/sidewire-sidebar-count-browser/identity.json',
    ),
);
const evidence =
    process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR ||
    '/private/tmp/sidewire-sidebar-count-browser';
(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const errors = [];
    async function login(page, email) {
        page.setDefaultTimeout(15000);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(origin + '/login');
        await page.getByLabel('Email address').fill(email);
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        await page.goto(origin + '/settings/profile');
    }
    async function mutate(page, path, body) {
        return page.evaluate(
            async ({ path, body }) => {
                const csrf = document.cookie
                    .split('; ')
                    .find((cookie) => cookie.startsWith('XSRF-TOKEN='));
                const response = await fetch(path, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(csrf.slice(11)),
                    },
                    body: JSON.stringify(body),
                });
                if (!response.ok)
                    throw new Error(`Fixture send failed: ${response.status}`);
                return response.json();
            },
            { path, body },
        );
    }
    try {
        fs.mkdirSync(evidence, { recursive: true });
        const ownerContext = await browser.newContext();
        const owner = await ownerContext.newPage();
        await login(owner, 'badge-owner@example.test');
        for (const width of [1440, 390]) {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.setViewportSize({ width, height: 900 });
            await login(
                page,
                width === 1440
                    ? 'badge-reader@example.test'
                    : 'badge-mobile@example.test',
            );
            const fixture = width === 1440 ? identity : identity.mobile;
            const summary = async () =>
                (
                    await (
                        await page.request.get(
                            origin + '/collaboration/updates',
                        )
                    ).json()
                ).unread_totals;
            const baseline = await summary();
            assert.equal(baseline.direct, 4);
            assert.ok(baseline.work > 99);
            async function badge(kind, count) {
                await page.waitForFunction(
                    ({ kind, count }) => {
                        const node = document.querySelector(
                            `.sw-sidebar .sw-nav-link[href="${kind === 'direct' ? '/messages' : '/chats'}"] .sw-nav-unseen-badge`,
                        );
                        return count === 0
                            ? !node
                            : node?.getAttribute('aria-label') ===
                                  `${count} unseen messages`;
                    },
                    { kind, count },
                );
            }
            async function nav(name) {
                if (width === 390)
                    await page
                        .getByRole('button', { name: 'Open navigation' })
                        .click();
                const rail = page.locator(
                    width === 390 ? '.sw-nav-sheet' : '.sw-sidebar',
                );
                await rail
                    .getByRole('link', { name: new RegExp('^' + name) })
                    .click();
            }
            await badge('direct', 4);
            await badge('work', baseline.work);
            if (width === 1440) {
                assert.equal(
                    await page
                        .locator('.sw-sidebar')
                        .getByRole('link', {
                            name: 'Messages 4 unseen messages',
                            exact: true,
                        })
                        .count(),
                    1,
                );
                assert.equal(
                    await page
                        .locator('.sw-sidebar')
                        .getByRole('link', {
                            name: `Work chats ${baseline.work} unseen messages`,
                            exact: true,
                        })
                        .count(),
                    1,
                );
            }
            assert.equal(
                await page
                    .locator(
                        '.sw-sidebar .sw-nav-link[href="/chats"] .sw-nav-unseen-badge',
                    )
                    .innerText(),
                '99+',
            );
            if (width === 390) {
                await page
                    .getByRole('button', { name: 'Open navigation' })
                    .click();
                const sheet = page.locator('.sw-nav-sheet');
                assert.equal(
                    await sheet
                        .getByLabel('4 unseen messages', { exact: true })
                        .innerText(),
                    '4',
                );
                assert.equal(
                    await sheet
                        .getByLabel(`${baseline.work} unseen messages`, {
                            exact: true,
                        })
                        .innerText(),
                    '99+',
                );
                await page.screenshot({
                    path: `${evidence}/sidebar-counts-${width}.png`,
                    animations: 'disabled',
                });
                await page.keyboard.press('Escape');
            } else
                await page.screenshot({
                    path: `${evidence}/sidebar-counts-${width}.png`,
                    animations: 'disabled',
                });
            await nav('Work chats');
            await page.waitForURL('**/chats');
            assert.deepEqual(await summary(), baseline); // Listing work previews is not reading.
            await nav('Messages');
            await page.waitForURL('**/messages');
            await page
                .locator('.sw-directory-scroll[aria-busy="false"]')
                .waitFor();
            assert.deepEqual(await summary(), baseline); // Listing DMs is not reading.
            await page
                .locator('.sw-conversation-row')
                .filter({ hasText: 'Badge Author' })
                .click();
            await badge('direct', 1); // Main history reads three roots; the hidden reply remains unseen.
            await page.goto(
                origin +
                    `/messages?chat=${fixture.dm}&thread=${fixture.dmroot}&message=${fixture.dmreply}`,
            );
            await page
                .locator(`article[data-message-id="${fixture.dmreply}"]`)
                .waitFor();
            await badge('direct', 0);
            await page.goto(origin + '/chats/' + identity.work);
            await page
                .getByRole('textbox', { name: 'Message', exact: true })
                .waitFor();
            await page.waitForFunction((before) => {
                const node = document.querySelector(
                    '.sw-sidebar .sw-nav-link[href="/chats"] .sw-nav-unseen-badge',
                );
                const count = Number(
                    node?.getAttribute('aria-label')?.split(' ')[0],
                );
                return count > 0 && count < before;
            }, baseline.work);
            const remaining = await summary();
            await page.goto(
                origin +
                    `/messages?chat=${identity.work}&thread=${identity.thread}&message=${identity.reply}`,
            );
            await page
                .locator(`article[data-message-id="${identity.reply}"]`)
                .waitFor();
            await page.waitForFunction((before) => {
                const node = document.querySelector(
                    '.sw-sidebar .sw-nav-link[href="/chats"] .sw-nav-unseen-badge',
                );
                const count = Number(
                    node?.getAttribute('aria-label')?.split(' ')[0],
                );
                return count > 0 && count < before;
            }, remaining.work);
            await badge('work', (await summary()).work);
            await page.goto(origin + '/settings/profile');
            const before = await summary();
            for (const chat of [fixture.dm, identity.work])
                await mutate(owner, `/collaboration/chats/${chat}/messages`, {
                    body: `Incoming badge check ${width}`,
                    idempotency_key: crypto.randomUUID(),
                });
            await page.evaluate(() => window.dispatchEvent(new Event('focus')));
            await badge('direct', 1);
            await badge('work', before.work + 1);
            assert.equal(
                await page.evaluate(
                    () => document.documentElement.scrollWidth > innerWidth,
                ),
                false,
            );
            await page.route('**/collaboration/updates*', (route) =>
                route.fulfill({
                    status: 403,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Review access revoked' }),
                }),
            );
            await page.evaluate(() => window.dispatchEvent(new Event('focus')));
            await page
                .getByRole('heading', { name: 'Your session has ended' })
                .waitFor();
            assert.equal(await page.locator('.sw-nav-unseen-badge').count(), 0);
            await context.close();
            console.log(
                `PASS: ${width}px exact DM/work counts, 99+ accessible totals, preview/read separation, hidden replies, incoming refresh and access-loss clearing`,
            );
        }
        assert.deepEqual(errors, []);
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
