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
            const text =
                'Follow up on this message ' + width + ' ' + Date.now();
            const title = 'Review proposal ' + width;
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
            async function convert() {
                if (width < 768) {
                    await row
                        .getByRole('button', {
                            name: 'Message actions',
                            exact: true,
                        })
                        .click();
                    await page
                        .getByRole('menuitem', {
                            name: 'Convert to todo',
                            exact: true,
                        })
                        .click();
                } else {
                    await row.hover();
                    await row
                        .getByRole('button', {
                            name: 'Convert to todo',
                            exact: true,
                        })
                        .click();
                }
            }
            await convert();
            const dialog = page.getByRole('dialog', {
                name: 'Convert to todo',
                exact: true,
            });
            await dialog
                .getByRole('textbox', { name: 'Todo title', exact: true })
                .fill('Cancelled todo');
            await dialog
                .getByRole('button', { name: 'Cancel', exact: true })
                .click();
            await dialog.waitFor({ state: 'hidden' });
            assert.equal(await row.getByRole('checkbox').count(), 0);
            await convert();
            await dialog
                .getByRole('textbox', { name: 'Todo title', exact: true })
                .fill(title);
            await dialog
                .getByRole('combobox', { name: 'Assign to', exact: true })
                .selectOption({ label: 'Todo Teammate' });
            const endpoint =
                '**/collaboration/chats/*/messages/' + id + '/todo';
            await page.route(endpoint, (route) =>
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        message: 'Synthetic create failure',
                    }),
                }),
            );
            await dialog
                .getByRole('button', { name: 'Create todo', exact: true })
                .click();
            await dialog.getByRole('alert').waitFor();
            assert.equal(
                await dialog
                    .getByRole('textbox', { name: 'Todo title', exact: true })
                    .inputValue(),
                title,
            );
            await page.unroute(endpoint);
            await dialog
                .getByRole('button', { name: 'Create todo', exact: true })
                .click();
            await dialog.waitFor({ state: 'hidden' });
            await row.getByText('Todo Teammate', { exact: true }).waitFor();
            if (width < 768) {
                assert.equal(
                    await row
                        .getByRole('button', { name: 'Edit todo', exact: true })
                        .isVisible(),
                    false,
                );
                await row
                    .getByRole('button', {
                        name: 'Message actions',
                        exact: true,
                    })
                    .click();
                await page
                    .getByRole('menuitem', { name: 'Edit todo', exact: true })
                    .click();
                await page
                    .getByRole('dialog', { name: 'Edit todo', exact: true })
                    .getByRole('button', { name: 'Cancel', exact: true })
                    .click();
                await page.getByRole('dialog').waitFor({ state: 'hidden' });
            }

            const check = row.getByRole('checkbox', {
                name: 'Complete todo: ' + title,
                exact: true,
            });
            await check.click();
            await row
                .getByRole('checkbox', {
                    name: 'Reopen todo: ' + title,
                    exact: true,
                })
                .waitFor();
            if (process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR) {
                fs.mkdirSync(process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR, {
                    recursive: true,
                });
                await page.screenshot({
                    path: `${process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR}/message-todo-${width}.png`,
                });
            }
            await page.goto(origin + '/todos');
            await page
                .getByRole('button', { name: 'Completed', exact: true })
                .click();
            const card = page
                .locator('article[data-todo-id]')
                .filter({
                    has: page.getByRole('heading', {
                        name: title,
                        exact: true,
                    }),
                })
                .filter({ hasText: text });
            await card.waitFor();
            assert.equal(await card.getByRole('checkbox').isChecked(), true);
            await card
                .getByRole('button', { name: 'Edit todo', exact: true })
                .click();
            const edit = page.getByRole('dialog', {
                name: 'Edit todo',
                exact: true,
            });
            await edit
                .getByRole('combobox', { name: 'Assign to', exact: true })
                .selectOption({ label: 'Editing Author' });
            await edit
                .getByRole('button', { name: 'Save todo', exact: true })
                .click();
            await edit.waitFor({ state: 'hidden' });
            await card.getByText('Editing Author', { exact: true }).waitFor();
            await page
                .getByRole('button', { name: 'Assigned to me', exact: true })
                .click();
            await card.waitFor();
            if (process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR)
                await page.screenshot({
                    path: `${process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR}/todos-${width}.png`,
                });
            assert.equal(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                ),
                true,
            );
            await card.getByRole('checkbox').click();
            await card.waitFor({ state: 'hidden' });
            await page
                .getByRole('button', { name: 'Open', exact: true })
                .click();
            await card.waitFor();
            await card.getByRole('link').click();
            await page.waitForURL('**/messages?**');
            const referenced = page.locator(`article[data-message-id="${id}"]`);
            await referenced.waitFor();
            await referenced
                .getByText('Editing Author', { exact: true })
                .last()
                .waitFor();
            assert.equal(
                await referenced.getByRole('checkbox').isChecked(),
                false,
            );
            assert.equal(
                await referenced
                    .getByRole('button', {
                        name: 'Convert to todo',
                        exact: true,
                    })
                    .count(),
                0,
            );
            console.log(
                `Message conversion, assignment, completion and references passed at ${width}px`,
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
