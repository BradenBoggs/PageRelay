const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-edit-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18013';
const identity = JSON.parse(
    fs.readFileSync(
        process.env.SIDEWIRE_TODO_IDENTITY ||
            '/private/tmp/sidewire-edit-browser/identity.json',
    ),
);
const png = fs.readFileSync(
    process.env.SIDEWIRE_TEST_THUMBNAIL ||
        '/private/tmp/sidewire-edit-browser/thumbnail.png',
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
        const badKey = crypto
            .createHash('sha256')
            .update('https://images.example.test/bad.png')
            .digest('hex');
        await page.route(
            '**/collaboration/chats/*/messages/*/images/*',
            (route) =>
                route.request().url().endsWith(badKey)
                    ? route.fulfill({
                          status: 422,
                          contentType: 'application/json',
                          body: '{"message":"Image preview unavailable."}',
                      })
                    : route.fulfill({
                          status: 200,
                          contentType: 'image/png',
                          body: png,
                      }),
        );
        await page.goto(origin + '/login');
        await page.getByLabel('Email address').fill('editing@example.test');
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(origin + '/messages?chat=' + identity.chat);
            const stamp = 'Image sample ' + Date.now();
            const body = `Review https://images.example.test/success.png and https://images.example.test/bad.png [PO 1234] ${stamp}`;
            await page
                .getByRole('textbox', { name: 'Message', exact: true })
                .fill(body);
            await page
                .getByRole('button', { name: 'Send', exact: true })
                .click();
            const row = page
                .locator('article[data-message-id]')
                .filter({ hasText: stamp });
            await row.waitFor();
            const id = await row.getAttribute('data-message-id');
            const stableRow = page.locator(`article[data-message-id="${id}"]`);
            const image = stableRow.getByRole('img');
            await image.waitFor();
            await page.waitForFunction(
                (id) =>
                    document.querySelector(
                        `article[data-message-id="${id}"] img`,
                    )?.naturalWidth === 160,
                id,
            );
            await stableRow
                .getByText('Image unavailable · Open link', { exact: true })
                .waitFor();
            assert.equal(
                await stableRow.locator('a.sw-message-url').count(),
                2,
            );
            assert.equal(
                await stableRow.locator('.sw-work-reference').count(),
                1,
            );
            const imageLink = stableRow
                .getByRole('link', {
                    name: 'Open image from images.example.test',
                    exact: true,
                })
                .first();
            assert.equal(
                await imageLink.getAttribute('rel'),
                'noopener noreferrer',
            );
            assert.equal(
                await imageLink.getAttribute('href'),
                'https://images.example.test/success.png',
            );
            await stableRow
                .getByRole('button', { name: 'Hide images', exact: true })
                .click();
            assert.equal(await stableRow.getByRole('img').count(), 0);
            await stableRow
                .getByRole('button', { name: 'Show images', exact: true })
                .click();
            await image.waitFor();
            await page.waitForFunction(
                (id) =>
                    document.querySelector(
                        `article[data-message-id="${id}"] img`,
                    )?.naturalWidth === 160,
                id,
            );
            assert.equal(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                ),
                true,
            );
            if (process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR) {
                fs.mkdirSync(process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR, {
                    recursive: true,
                });
                await page.screenshot({
                    path: `${process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR}/images-${width}.png`,
                });
            }
            if (width < 768) {
                await stableRow
                    .getByRole('button', {
                        name: 'Message actions',
                        exact: true,
                    })
                    .click();
                await page
                    .getByRole('menuitem', {
                        name: 'Delete message',
                        exact: true,
                    })
                    .click();
            } else {
                await stableRow.hover();
                await stableRow
                    .getByRole('button', {
                        name: 'Delete message',
                        exact: true,
                    })
                    .click();
            }
            await page
                .getByRole('dialog', { name: 'Delete message?' })
                .getByRole('button', { name: 'Delete message', exact: true })
                .click();
            await stableRow
                .getByText('Message deleted', { exact: true })
                .waitFor();
            assert.equal(await stableRow.getByRole('img').count(), 0);
            console.log(
                `Image thumbnails, fallback, hide/show and deletion passed at ${width}px`,
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
