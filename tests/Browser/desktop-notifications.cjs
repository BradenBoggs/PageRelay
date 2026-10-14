const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-edit-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18019';
const evidence =
    process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR ||
    '/private/tmp/sidewire-desktop-browser';
const fixtures = JSON.parse(
    fs.readFileSync('/private/tmp/sidewire-desktop-browser/fixtures.json'),
);

(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    try {
        for (const fixture of fixtures) {
            const context = await browser.newContext({
                viewport: { width: fixture.width, height: 900 },
            });
            const page = await context.newPage();
            const errors = [];
            const notices = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.exposeFunction('captureDesktopNotice', (notice) =>
                notices.push(notice),
            );
            await page.addInitScript(() => {
                window.desktopNotices = [];
                class ReviewNotification {
                    static permission = 'granted';
                    constructor(title, options) {
                        this.title = title;
                        this.options = options;
                        window.desktopNotices.push(this);
                    }
                    set onclick(handler) {
                        this.click = handler;
                        window.captureDesktopNotice({
                            title: this.title,
                            ...this.options,
                        });
                    }
                    close() {}
                }
                window.Notification = ReviewNotification;
            });
            await page.goto(origin + '/login');
            await page.getByLabel('Email address').fill(fixture.email);
            await page.getByLabel('Password', { exact: true }).fill('password');
            await page
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            await page.waitForURL('**/messages');
            await page.waitForFunction(
                () =>
                    window.desktopNotices.length === 1 &&
                    typeof window.desktopNotices[0].click === 'function',
            );
            assert.equal(notices.length, 1);
            const attention = await (
                await page.request.get(origin + '/collaboration/notifications')
            ).json();
            assert.equal(
                attention.unread_count,
                1,
                'Delivery alone must not mark messages read',
            );
            const target = fixture.target;
            const item = attention.data.find(
                (item) => item.message_id === target.message,
            );
            assert.ok(item);
            assert.equal(notices[0].title, target.title);
            assert.equal(notices[0].body, target.body);
            assert.equal(notices[0].tag, 'sidewire-' + item.id);
            const navigation = page.waitForURL(
                (url) => url.searchParams.get('message') === target.message,
            );
            await page.evaluate(() => window.desktopNotices[0].click());
            await navigation;
            const query = new URL(page.url()).searchParams;
            assert.equal(query.get('chat'), target.chat);
            assert.equal(query.get('thread'), target.thread);
            const article = page.locator(
                `article[data-message-id="${target.message}"]`,
            );
            await article.waitFor({ state: 'visible' });
            assert.ok(
                (await article.getAttribute('class')).includes(
                    'sw-message-target',
                ),
            );
            await page.waitForFunction((id) => {
                const node = document.querySelector(
                    `article[data-message-id="${id}"]`,
                );
                const history = node?.closest('.sw-collaboration-history');
                if (!node || !history) return false;
                const row = node.getBoundingClientRect();
                const bounds = history.getBoundingClientRect();
                return row.bottom > bounds.top && row.top < bounds.bottom;
            }, target.message);
            assert.equal(
                await page.evaluate(
                    () => document.documentElement.scrollWidth > innerWidth,
                ),
                false,
            );
            fs.mkdirSync(evidence, { recursive: true });
            await page.screenshot({
                path: `${evidence}/desktop-click-${fixture.kind}-${fixture.width}.png`,
            });
            if (fixture.kind === 'mention') {
                await page
                    .getByRole('button', { name: /^Notifications/ })
                    .click();
                await page
                    .getByRole('menuitem', { name: 'Notification settings' })
                    .click();
                await page
                    .getByText(
                        /Desktop alerts show the sender, chat name and a short message preview/,
                    )
                    .waitFor();
                await page.keyboard.press('Escape');
            }
            assert.deepEqual(errors, []);
            await context.close();
        }
        console.log(
            'Desktop notification context and click acceptance passed at 1440px/390px. Native OS display is not verified.',
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
