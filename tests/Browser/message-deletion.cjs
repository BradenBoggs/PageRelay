const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-deletion-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18010';
const identity = JSON.parse(
    fs.readFileSync(
        process.env.SIDEWIRE_DELETION_IDENTITY ||
            '/private/tmp/sidewire-deletion-review/identity.json',
    ),
);
const evidence = process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR;

// Requires synthetic verified owner/member fixtures and a disposable shared work chat.
(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const errors = [];
    try {
        const owner = await browser.newPage();
        const member = await browser.newPage();
        for (const [page, email] of [
            [owner, 'deletion-owner@example.test'],
            [member, 'deletion-member@example.test'],
        ]) {
            page.setDefaultTimeout(15000);
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(origin + '/login');
            await page.getByLabel('Email address').fill(email);
            await page.getByLabel('Password', { exact: true }).fill('password');
            await page
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            await page.waitForURL('**/messages');
            await page.goto(origin + '/messages?chat=' + identity.chat);
        }
        console.log('Signed in both synthetic users');
        const ownerMessage = member
            .locator('article[data-message-id]')
            .filter({ hasText: 'Owner message' });
        await ownerMessage.waitFor();
        assert.equal(
            await ownerMessage
                .getByRole('button', { name: 'Delete message', exact: true })
                .count(),
            0,
        );
        for (const width of [1440, 390]) {
            await member.setViewportSize({ width, height: 900 });
            console.log('Checking width', width);
            const text = 'Own message to delete at ' + width;
            await member
                .getByRole('textbox', { name: 'Message', exact: true })
                .fill(text);
            await member
                .getByRole('button', { name: 'Send', exact: true })
                .click();
            const row = member
                .locator('article[data-message-id]')
                .filter({ hasText: text });
            await row.waitFor();
            const id = await row.getAttribute('data-message-id');
            await row.hover();
            async function openDelete() {
                if (width < 768) {
                    await row
                        .getByRole('button', {
                            name: 'Message actions',
                            exact: true,
                        })
                        .click();
                    await member
                        .getByRole('menuitem', {
                            name: 'Delete message',
                            exact: true,
                        })
                        .click();
                } else {
                    await row
                        .getByRole('button', {
                            name: 'Delete message',
                            exact: true,
                        })
                        .click();
                }
            }
            await openDelete();
            const dialog = member.getByRole('dialog', {
                name: 'Delete message?',
            });
            await dialog.waitFor();
            await dialog
                .getByRole('button', { name: 'Cancel', exact: true })
                .click();
            await member.waitForFunction(
                (label) =>
                    document.activeElement?.getAttribute('aria-label') ===
                    label,
                width < 768 ? 'Message actions' : 'Delete message',
            );
            await openDelete();
            await member.route(
                '**/collaboration/chats/*/messages/' + id,
                (route) =>
                    route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: '{"message":"Synthetic deletion failure"}',
                    }),
            );
            await dialog
                .getByRole('button', { name: 'Delete message', exact: true })
                .click();
            await dialog
                .getByRole('alert')
                .getByText('Synthetic deletion failure')
                .waitFor();
            await member.unroute('**/collaboration/chats/*/messages/' + id);
            await dialog
                .getByRole('button', { name: 'Delete message', exact: true })
                .click();
            await dialog.waitFor({ state: 'hidden' });
            await member.waitForFunction(
                (id) =>
                    document.activeElement?.getAttribute('data-message-id') ===
                    id,
                id,
            );
            await member
                .locator(`[data-message-id="${id}"]`)
                .getByText('Message deleted', { exact: true })
                .waitFor();
            const tombstone = member.locator(`[data-message-id="${id}"]`);
            assert.equal(
                (await tombstone.innerText()).trim(),
                'Message deleted',
            );
            assert.equal(
                await tombstone
                    .locator(
                        'header, time, a, .sw-message-avatar, .sw-message-actions',
                    )
                    .count(),
                0,
            );
            assert.equal(
                await tombstone.evaluate(
                    (element) => getComputedStyle(element).borderTopStyle,
                ),
                'solid',
            );
            assert.equal(
                await member.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                ),
                true,
            );
            if (evidence) {
                fs.mkdirSync(evidence, { recursive: true });
                await member.screenshot({
                    path: `${evidence}/deletion-${width}.png`,
                    fullPage: true,
                });
            }
        }
        await owner.reload();
        const retained = owner
            .locator('article[data-message-id]')
            .filter({ hasText: 'Member history survives' });
        await retained.waitFor();
        assert.equal(
            await retained
                .getByRole('button', { name: 'Delete message', exact: true })
                .count(),
            1,
        );
        await owner.goto(origin + '/settings/organization');
        owner.once('dialog', (dialog) => dialog.dismiss());
        await owner
            .getByRole('button', { name: 'Remove access', exact: true })
            .click();
        await owner.getByText('Deletion Member', { exact: true }).waitFor();
        owner.once('dialog', (dialog) => {
            assert.match(
                dialog.message(),
                /messages and author history will be kept/,
            );
            return dialog.accept();
        });
        await owner
            .getByRole('button', { name: 'Remove access', exact: true })
            .click();
        await owner
            .getByText('Deletion Member', { exact: true })
            .waitFor({ state: 'hidden' });
        await owner.goto(origin + '/messages?chat=' + identity.chat);
        await owner
            .locator('article[data-message-id]')
            .filter({ hasText: 'Member history survives' })
            .getByText('Deletion Member', { exact: true })
            .waitFor();
        const revoked = await member.request.get(
            origin + '/collaboration/chats/' + identity.chat + '/messages',
        );
        assert.equal(revoked.status(), 403);
        assert.deepEqual(errors, []);
        console.log(
            'Passed: own-message deletion/cancel/failure/retry at 1440 and 390px; admin action visibility; remove-access cancel/confirm; history attribution and access denial.',
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
