const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-edit-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18018';
const evidence =
    process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR ||
    '/private/tmp/sidewire-notification-browser';
(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await context.addInitScript(() => {
        window.reviewNotices = [];
        window.reviewPermissionRequests = 0;
        class ReviewNotification {
            static permission = 'default';
            static async requestPermission() {
                window.reviewPermissionRequests++;
                return this.permission;
            }
            constructor(title, options) {
                window.reviewNotices.push({ title, ...options });
            }
            close() {}
        }
        window.Notification = ReviewNotification;
    });
    try {
        await page.goto(origin + '/login');
        await page
            .getByLabel('Email address')
            .fill('notification-member@example.test');
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        await page.goto(origin + '/settings/profile');
        console.log('Logged in on profile');
        const before = await (
            await page.request.get(origin + '/collaboration/notifications')
        ).json();
        assert.ok(before.unread_count > 0);
        const baseline = [];
        for (let next = 1; next !== null;) {
            const result = await (
                await page.request.get(
                    origin +
                        '/collaboration/notifications/history?page=' +
                        next,
                )
            ).json();
            baseline.push(...result.data);
            next = result.next_page;
        }
        console.log(`Baseline history: ${baseline.length}`);
        const readRequests = [];
        page.on('request', (request) => {
            if (
                request.method() === 'POST' &&
                /\/(read|claim|delivered)$/.test(
                    new URL(request.url()).pathname,
                )
            )
                readRequests.push(request.url());
        });
        fs.mkdirSync(evidence, { recursive: true });
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            const bell = page.getByRole('button', { name: /^Notifications/ });
            await bell.click();
            console.log(`Opened bell at ${width}px`);
            const panel = page.getByRole('menu', {
                name: 'Notifications',
                exact: true,
            });
            await page.waitForFunction(
                () =>
                    document.querySelectorAll('.sw-notification-item')
                        .length === 30,
            );
            assert.equal(
                await panel
                    .getByRole('button', { name: 'Enable on this browser' })
                    .count(),
                0,
            );
            await panel
                .getByRole('menuitem', { name: 'Load older notifications' })
                .click();
            await page.waitForFunction(
                (count) =>
                    document.querySelectorAll('.sw-notification-item')
                        .length === count,
                baseline.length,
            );
            assert.ok(
                (await panel.getByText('Read', { exact: true }).count()) > 0,
            );
            assert.ok(
                (await panel.getByText('Unread', { exact: true }).count()) > 0,
            );
            assert.equal(
                await panel.getByText('Real direct notification').count(),
                1,
            );
            assert.equal(
                await panel.getByText('Real thread notification').count(),
                1,
            );
            assert.equal(
                await panel
                    .getByRole('menuitem', { name: 'Load older notifications' })
                    .count(),
                0,
            );
            assert.deepEqual(readRequests, []);
            assert.equal(
                (
                    await (
                        await page.request.get(
                            origin + '/collaboration/notifications',
                        )
                    ).json()
                ).unread_count,
                before.unread_count,
            );
            const bounds = await panel.boundingBox();
            assert.ok(
                bounds.x >= 0 &&
                    bounds.x + bounds.width <= width &&
                    bounds.y + bounds.height <= 900,
            );
            assert.equal(
                await page.evaluate(
                    () => document.documentElement.scrollWidth > innerWidth,
                ),
                false,
            );
            await page.screenshot({
                path: `${evidence}/notifications-${width}.png`,
                animations: 'disabled',
            });
            assert.equal(
                await page.evaluate(() => window.reviewPermissionRequests),
                width === 1440 ? 0 : 2,
            );
            // Recovery refresh keeps all previously loaded history visible.
            const refreshed = page.waitForResponse((response) =>
                response.url().includes('/notifications/history?page=2'),
            );
            await page.evaluate(() => window.dispatchEvent(new Event('focus')));
            await refreshed;
            await page.waitForFunction(
                (count) =>
                    document.querySelectorAll('.sw-notification-item')
                        .length === count,
                baseline.length,
            );
            await panel
                .getByRole('menuitem', { name: 'Notification settings' })
                .focus();
            await page.keyboard.press('Enter');
            const settings = page.getByRole('dialog', {
                name: 'Notification settings',
            });
            await settings.waitFor();
            assert.equal(await panel.count(), 0);
            await page.screenshot({
                path: `${evidence}/notification-settings-${width}.png`,
                animations: 'disabled',
            });
            if (width === 1440) {
                await settings
                    .getByRole('button', { name: 'Enable on this browser' })
                    .click();
                await settings
                    .getByText(/Notifications are blocked or unsupported/)
                    .waitFor();
                await page.evaluate(() => {
                    Notification.permission = 'granted';
                });
                await settings
                    .getByRole('button', { name: 'Enable on this browser' })
                    .click();
                await settings
                    .getByText(/Enabled\. Browser and operating-system/)
                    .waitFor();
                await settings
                    .getByRole('button', { name: 'Pause desktop alerts' })
                    .waitFor({ state: 'visible' });
                await page.waitForFunction(
                    () =>
                        ![...document.querySelectorAll('button')].find(
                            (button) =>
                                button.textContent === 'Pause desktop alerts',
                        ).disabled,
                );
                await settings
                    .getByRole('button', { name: 'Send test notification' })
                    .click();
                await settings.getByText(/Test requested/).waitFor();
                assert.equal(
                    await page.evaluate(() => window.reviewNotices.length),
                    1,
                );
                await settings
                    .getByRole('button', { name: 'Pause desktop alerts' })
                    .click();
                await settings.getByText(/Desktop alerts paused/).waitFor();
                await settings.getByText('Off', { exact: true }).waitFor();
                assert.equal(
                    await page.evaluate(() => window.reviewPermissionRequests),
                    2,
                );
                assert.equal(
                    (
                        await (
                            await page.request.get(
                                origin + '/collaboration/notifications',
                            )
                        ).json()
                    ).enabled,
                    false,
                );
            }
            await settings
                .getByRole('button', { name: 'Close dialog' })
                .click();
            await settings.waitFor({ state: 'hidden' });
            await page.waitForFunction(() =>
                document.activeElement?.classList.contains(
                    'sw-notification-trigger',
                ),
            );
            assert.equal(
                await bell.evaluate((node) => node === document.activeElement),
                true,
            );
            await page.keyboard.press('Enter');
            await panel.waitFor();
            await page.keyboard.press('Escape');
            await panel.waitFor({ state: 'hidden' });
            await page.waitForFunction(() =>
                document.activeElement?.classList.contains(
                    'sw-notification-trigger',
                ),
            );
            assert.equal(
                await bell.evaluate((node) => node === document.activeElement),
                true,
            );
            // Loading, recoverable errors and empty history use the compiled React UI.
            let release;
            const held = new Promise((resolve) => {
                release = resolve;
            });
            await page.route(
                '**/collaboration/notifications/history?*',
                async (route) => {
                    await held;
                    await route.fulfill({
                        status: 503,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            message: 'Review notification failure',
                        }),
                    });
                },
            );
            await bell.click();
            // A new open must not show cached private previews while awaiting authorization.
            await panel.getByText('Loading notifications…').waitFor();
            release();
            await panel.getByText('Review notification failure').waitFor();
            await page.unroute('**/collaboration/notifications/history?*');
            await panel.getByRole('menuitem', { name: 'Try again' }).click();
            await page.waitForFunction(
                () =>
                    document.querySelectorAll('.sw-notification-item')
                        .length === 30,
            );
            await page.keyboard.press('Escape');
            await page.route(
                '**/collaboration/notifications/history?*',
                (route) =>
                    route.fulfill({
                        contentType: 'application/json',
                        body: JSON.stringify({ data: [], next_page: null }),
                    }),
            );
            await bell.click();
            await panel.getByText('No notifications yet').waitFor();
            await page.screenshot({
                path: `${evidence}/notifications-empty-${width}.png`,
                animations: 'disabled',
            });
            await page.keyboard.press('Escape');
            await page.unroute('**/collaboration/notifications/history?*');
            console.log(
                `PASS: ${width}px history, pagination, no-read semantics, settings, keyboard focus, loading/error/empty states and viewport bounds`,
            );
        }
        // Follow a real notification to its exact thread/message.
        await page.getByRole('button', { name: /^Notifications/ }).click();
        const link = page
            .getByRole('menuitem')
            .filter({ hasText: 'Real thread notification' });
        await link.waitFor();
        const href = await link.getAttribute('href');
        const target = new URL(href, origin);
        assert.ok(
            target.searchParams.get('chat') &&
                target.searchParams.get('thread') &&
                target.searchParams.get('message'),
        );
        await link.click();
        await page.waitForURL(origin + href);
        await page
            .locator(
                `article[data-message-id="${target.searchParams.get('message')}"]`,
            )
            .waitFor();
        assert.equal(
            await page.evaluate(() => window.reviewPermissionRequests),
            0,
        ); // New page; permission is only requested from settings.
        assert.deepEqual(errors, []);
        console.log('PASS: exact thread-message navigation; no browser errors');
    } catch (error) {
        await page.screenshot({ path: `${evidence}/failure.png` });
        throw error;
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
