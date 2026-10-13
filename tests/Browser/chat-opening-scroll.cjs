const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-edit-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18016';
const fixture = JSON.parse(
    fs.readFileSync(
        process.env.SIDEWIRE_SCROLL_IDENTITY ||
            '/private/tmp/sidewire-controls-browser/scroll.json',
    ),
);
(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
        await page.goto(origin + '/login');
        await page
            .getByLabel('Email address')
            .fill('controls-member@example.test');
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            for (const path of [
                '/messages?chat=' + fixture.chat,
                '/chats/' + fixture.chat,
            ]) {
                await page.goto(origin + path);
                await page.getByText(/^Scrolling message 90 /).waitFor();
                await page.waitForFunction(() => {
                    const history = document.querySelector(
                        '.sw-main-stream .sw-collaboration-history',
                    );
                    return (
                        history &&
                        history.scrollHeight -
                            history.scrollTop -
                            history.clientHeight <
                            5
                    );
                });
                const history = page.locator(
                    '.sw-main-stream .sw-collaboration-history',
                );
                assert.ok(await history.evaluate((node) => node.scrollTop > 0));
                await history.evaluate((node) => {
                    node.scrollTop = node.scrollHeight / 2;
                });
                const before = await history.evaluate((node) => node.scrollTop);
                const refreshed = page.waitForResponse(
                    (response) =>
                        response.url().includes('/messages?') &&
                        response.request().method() === 'GET',
                );
                await page.evaluate(() =>
                    window.dispatchEvent(new Event('focus')),
                );
                await refreshed;
                await page.waitForFunction(
                    (position) =>
                        Math.abs(
                            document.querySelector(
                                '.sw-main-stream .sw-collaboration-history',
                            ).scrollTop - position,
                        ) < 5,
                    before,
                );
            }
            await page.goto(
                origin +
                    `/messages?chat=${fixture.chat}&message=${fixture.target}`,
            );
            const target = page.locator(
                `article[data-message-id="${fixture.target}"]`,
            );
            await target.waitFor();
            await page.waitForFunction((id) => {
                const history = document.querySelector(
                    '.sw-main-stream .sw-collaboration-history',
                );
                const target = document.querySelector(
                    `article[data-message-id="${id}"]`,
                );
                if (!history || !target) return false;
                const pane = history.getBoundingClientRect();
                const item = target.getBoundingClientRect();
                return (
                    item.top >= pane.top &&
                    item.top < pane.bottom &&
                    history.scrollHeight -
                        history.scrollTop -
                        history.clientHeight >
                        120
                );
            }, fixture.target);
            console.log(
                `Newest-message opens and targeted navigation passed at ${width}px`,
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
