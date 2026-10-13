const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-edit-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18012';
const identity = JSON.parse(
    fs.readFileSync(
        process.env.SIDEWIRE_EDIT_IDENTITY ||
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
        await page.goto(origin + '/messages?chat=' + identity.chat);
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            const text = 'Message for editing ' + width + ' ' + Date.now();
            await page
                .getByRole('textbox', { name: 'Message', exact: true })
                .fill(text);
            await page
                .getByRole('button', { name: 'Send', exact: true })
                .click();
            const row = page
                .locator('article[data-message-id]')
                .filter({ hasText: text });
            await row.waitFor();
            const id = await row.getAttribute('data-message-id');
            const stableRow = page.locator(`article[data-message-id="${id}"]`);
            async function action(name) {
                if (width < 768) {
                    await stableRow
                        .getByRole('button', {
                            name: 'Message actions',
                            exact: true,
                        })
                        .click();
                    await page
                        .getByRole('menuitem', { name, exact: true })
                        .click();
                } else {
                    await stableRow.hover();
                    await stableRow
                        .getByRole('button', { name, exact: true })
                        .click();
                }
            }
            if (width < 768) {
                assert.equal(
                    await stableRow
                        .getByRole('button', {
                            name: 'Edit message',
                            exact: true,
                        })
                        .isVisible(),
                    false,
                );
                await stableRow
                    .getByRole('button', {
                        name: 'Message actions',
                        exact: true,
                    })
                    .focus();
                await page.keyboard.press('Enter');
                await page.getByRole('menu').waitFor();
                await page.keyboard.press('Escape');
                await page.waitForFunction(
                    (id) =>
                        document.activeElement
                            ?.closest('article')
                            ?.getAttribute('data-message-id') === id &&
                        document.activeElement?.getAttribute('aria-label') ===
                            'Message actions',
                    id,
                );
            }
            await action('Edit message');
            const dialog = page.getByRole('dialog', {
                name: 'Edit message',
                exact: true,
            });
            await dialog
                .getByRole('textbox', { name: 'Message', exact: true })
                .fill('Cancelled edit');
            await dialog
                .getByRole('button', { name: 'Cancel', exact: true })
                .click();
            await page.getByRole('dialog').waitFor({ state: 'hidden' });
            assert.match(await stableRow.innerText(), new RegExp(text));
            await action('Edit message');
            await dialog
                .getByRole('textbox', { name: 'Message', exact: true })
                .fill('Saved edit ' + width);
            await page.route(
                '**/collaboration/chats/*/messages/' + id,
                (route) =>
                    route.request().method() === 'PATCH'
                        ? route.fulfill({
                              status: 500,
                              contentType: 'application/json',
                              body: JSON.stringify({
                                  message: 'Temporary save failure',
                              }),
                          })
                        : route.continue(),
            );
            await dialog
                .getByRole('button', { name: 'Save changes', exact: true })
                .click();
            await dialog.getByRole('alert').waitFor();
            assert.equal(
                await dialog
                    .getByRole('textbox', { name: 'Message', exact: true })
                    .inputValue(),
                'Saved edit ' + width,
            );
            await page.unroute('**/collaboration/chats/*/messages/' + id);
            await dialog
                .getByRole('textbox', { name: 'Message', exact: true })
                .press('Control+Enter');
            await dialog.waitFor({ state: 'hidden' });
            await stableRow
                .getByText('Saved edit ' + width, { exact: true })
                .waitFor();
            await stableRow.getByText('Edited', { exact: true }).waitFor();
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
                    path: `${process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR}/editing-${width}.png`,
                });
            }
            await action('Delete message');
            await page
                .getByRole('dialog', { name: 'Delete message?' })
                .getByRole('button', { name: 'Delete message', exact: true })
                .click();
            await stableRow
                .getByText('Message deleted', { exact: true })
                .waitFor();
            console.log(`Message editing and actions passed at ${width}px`);
        }
        assert.deepEqual(errors, []);
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
