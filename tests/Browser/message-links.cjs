const assert = require('node:assert/strict');
const fs = require('node:fs');
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
        await page.getByLabel('Email address').fill('editing@example.test');
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(origin + '/messages?chat=' + identity.chat);
            const input = page.getByRole('textbox', {
                name: 'Message',
                exact: true,
            });
            await page
                .getByRole('button', {
                    name: 'Insert reference badge',
                    exact: true,
                })
                .click();
            await page.waitForFunction(
                () => document.activeElement?.tagName === 'TEXTAREA',
            );
            await page.keyboard.insertText('PO 1234');
            assert.equal(await input.inputValue(), '[ PO 1234]');
            const stamp = 'Reference sample ' + Date.now();
            const body = `See https://example.com/quote?id=42, http://localhost:8000/orders and www.example.com. [PO 1234] check [SO GPS-42] and [Invoice 9012] with [QUOTE Q7]. [Other text] <img src=x onerror=alert(1)> ${stamp}`;
            await input.fill(body);
            await page
                .getByRole('button', { name: 'Send', exact: true })
                .click();
            const row = page
                .locator('article[data-message-id]')
                .filter({ hasText: stamp });
            await row.waitFor();
            assert.equal(await row.locator('.sw-work-reference').count(), 5);
            assert.equal(await row.locator('a.sw-message-url').count(), 3);
            const link = row.getByRole('link', {
                name: 'https://example.com/quote?id=42',
                exact: true,
            });
            assert.equal(await link.getAttribute('target'), '_blank');
            assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
            await page
                .context()
                .route('https://example.com/**', (route) =>
                    route.fulfill({
                        status: 200,
                        contentType: 'text/html',
                        body: '<p>Synthetic link destination</p>',
                    }),
                );
            const opened = page.waitForEvent('popup');
            await link.click();
            const popup = await opened;
            await popup.waitForLoadState();
            assert.equal(popup.url(), 'https://example.com/quote?id=42');
            await popup.close();

            assert.deepEqual(
                await row.locator('.sw-work-reference').allTextContents(),
                [
                    'PO 1234',
                    'SO GPS-42',
                    'Invoice 9012',
                    'QUOTE Q7',
                    'Other text',
                ],
            );
            assert.equal(
                await row.locator('.sw-work-reference a, img').count(),
                0,
            );
            assert.equal(
                await row
                    .locator('.sw-work-reference')
                    .first()
                    .getAttribute('aria-label'),
                'Reference: PO 1234',
            );
            if (width < 768) {
                await row
                    .getByRole('button', {
                        name: 'Message actions',
                        exact: true,
                    })
                    .click();
                await page
                    .getByRole('menuitem', {
                        name: 'Edit message',
                        exact: true,
                    })
                    .click();
            } else {
                await row.hover();
                await row
                    .getByRole('button', { name: 'Edit message', exact: true })
                    .click();
            }
            const dialog = page.getByRole('dialog', {
                name: 'Edit message',
                exact: true,
            });
            assert.equal(
                await dialog
                    .getByRole('textbox', { name: 'Message', exact: true })
                    .inputValue(),
                body,
            );
            await dialog
                .getByRole('button', { name: 'Cancel', exact: true })
                .click();
            await dialog.waitFor({ state: 'hidden' });
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
                    path: `${process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR}/links-${width}.png`,
                });
            }
            console.log(
                `Clickable URLs, badges and plain-text editing passed at ${width}px`,
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
