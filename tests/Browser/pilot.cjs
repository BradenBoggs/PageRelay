const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const browserRequire = createRequire('/tmp/pilot-browser/package.json');
const { chromium } = browserRequire('playwright');

(async () => {
    const errors = [];
    const browser = await chromium.launch({ headless: true });
    let extension;
    try {
        const ownerContext = await browser.newContext();
        const adminContext = await browser.newContext();
        const owner = await ownerContext.newPage();
        const admin = await adminContext.newPage();
        for (const page of [owner, admin]) {
            page.on('pageerror', (error) => errors.push(error.message));
        }
        async function login(page, email) {
            await page.goto('http://localhost:8000/login');
            await page.getByLabel('Email address').fill(email);
            await page.getByLabel('Password', { exact: true }).fill('password');
            await page
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            await page.waitForURL('**/dashboard');
            await page.goto('http://localhost:8000/messages');
        }
        // Capture notification API calls, not a claim of native Linux/Windows toast delivery.
        await ownerContext.addInitScript(() => {
            window.pilotNotices = [];
            class ReviewNotification {
                static permission = 'granted';
                static async requestPermission() {
                    return 'granted';
                }
                constructor(title, options) {
                    window.pilotNotices.push({ title, ...options });
                }
                close() {}
            }
            window.Notification = ReviewNotification;
        });
        await login(owner, 'owner@example.test');
        await login(admin, 'admin@example.test');
        await owner
            .getByText(/^Notifications/)
            .first()
            .click();
        await owner
            .getByRole('button', { name: 'Enable on this browser' })
            .click();
        await owner
            .getByText('Enabled. Browser and operating-system')
            .waitFor();

        const extensionPath = path.resolve('apps/extension/dist');
        extension = await chromium.launchPersistentContext('', {
            channel: 'chromium',
            headless: true,
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
            ],
        });
        const worker =
            extension.serviceWorkers()[0] ||
            (await extension.waitForEvent('serviceworker'));
        const identity = JSON.parse(
            fs.readFileSync('/tmp/sidewire-pilot-identity.json', 'utf8'),
        );
        await worker.evaluate(async (session) => {
            await chrome.storage.local.set({
                'sidewire.extension.session': session,
            });
        }, identity);
        const extensionId = new URL(worker.url()).host;
        const panel = await extension.newPage();
        panel.on('pageerror', (error) => errors.push(error.message));
        await panel.setViewportSize({ width: 390, height: 900 });
        await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);
        await panel
            .getByRole('button', { name: 'Messages & DMs', exact: true })
            .click();
        await panel
            .getByRole('button', { name: 'Direct messages', exact: true })
            .click();
        await panel.getByText('New direct message', { exact: true }).click();
        await panel
            .getByRole('button', { name: 'Review Owner', exact: true })
            .click();
        await panel
            .getByRole('textbox', { name: 'Message', exact: true })
            .fill('Review quote 1001 @Review Owner');
        await panel
            .getByRole('button', { name: '@Review Owner', exact: true })
            .click();
        await panel.getByRole('button', { name: 'Send', exact: true }).click();
        await panel
            .locator('article')
            .filter({ hasText: 'Review quote 1001' })
            .waitFor();

        await owner.waitForFunction(
            () => window.pilotNotices.length > 0,
            null,
            { timeout: 15000 },
        );
        const notices = await owner.evaluate(() => window.pilotNotices);
        assert.equal(
            notices.length,
            1,
            'Overlapping DM/mention must create one desktop API call',
        );
        assert(
            !notices[0].body.includes('1001'),
            'Desktop preview must not contain quote text',
        );
        await owner.getByRole('button', { name: /^Activity/ }).click();
        await owner
            .locator('.sw-conversation-row')
            .filter({ hasText: 'Review quote 1001' })
            .click();
        const root = owner
            .locator('article')
            .filter({ hasText: 'Review quote 1001' });
        await root.waitFor();
        const messageLink = await root
            .getByRole('link', { name: 'Message link' })
            .getAttribute('href');
        const chatId = new URL(
            messageLink,
            'http://localhost:8000',
        ).searchParams.get('chat');
        assert(chatId);
        await root.getByRole('button', { name: 'Reply in thread' }).click();
        await owner
            .getByRole('textbox', { name: 'Reply to this thread' })
            .fill('Confirmed in the thread.');
        await owner
            .getByRole('button', { name: 'Send reply', exact: true })
            .click();
        await owner
            .locator('article')
            .filter({ hasText: 'Confirmed in the thread.' })
            .waitFor();
        await panel
            .getByRole('button', { name: '1 replies', exact: true })
            .waitFor({ timeout: 15000 });
        assert.equal(
            await panel
                .locator('article')
                .filter({ hasText: 'Confirmed in the thread.' })
                .count(),
            0,
        );
        await panel
            .getByRole('button', { name: '1 replies', exact: true })
            .click();
        await panel
            .locator('article')
            .filter({ hasText: 'Confirmed in the thread.' })
            .waitFor();

        const status = await admin.evaluate(async (id) => {
            const response = await fetch(
                `/collaboration/chats/${id}/messages`,
                { headers: { Accept: 'application/json' } },
            );
            return response.status;
        }, chatId);
        assert.equal(
            status,
            404,
            'Nonparticipant administrator cannot read a DM',
        );
        await owner.screenshot({
            path: '/tmp/pilot-evidence/web-thread.png',
            fullPage: true,
        });
        await panel.screenshot({
            path: '/tmp/pilot-evidence/extension-thread.png',
            fullPage: true,
        });
        assert.deepEqual(
            errors,
            [],
            'Clients must not throw uncaught page errors',
        );
        console.log(
            'PASS: two authenticated clients; installed extension; DM, selected mention, deduplicated private notification API call, live reply, thread separation and nonparticipant-admin denial.',
        );
        console.log(
            'NOT VERIFIED: native OS toasts, Chrome side-panel container lifecycle, real GPS desktops or production deployment.',
        );
    } finally {
        if (extension) await extension.close();
        await browser.close();
    }
})().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
