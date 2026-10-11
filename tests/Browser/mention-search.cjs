const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE)(
    'playwright',
);
const origin = process.env.SIDEWIRE_BROWSER_URL;
const identity = JSON.parse(
    fs.readFileSync(process.env.SIDEWIRE_MENTION_IDENTITY, 'utf8'),
);
const evidence = process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR;

// Disposable fixture: verified search-owner and two coworkers named
// Morgan Alexandra Reed and Morgan Willow Reed, in a shared work chat.
(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const errors = [];
    try {
        const page = await browser.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(origin + '/login');
        await page
            .getByLabel('Email address')
            .fill('search-owner@example.test');
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(`${origin}/messages?chat=${identity.chat}`);
            const input = page.getByRole('textbox', {
                name: 'Message',
                exact: true,
            });
            await input.waitFor();
            for (const [query, count] of [
                ['mOrGaN', 2],
                ['rEeD', 2],
                ['xAnDr', 1],
                ['DRA rE', 1],
            ]) {
                const loaded = page.waitForResponse(
                    (response) =>
                        response.url().includes('/collaboration/members?') &&
                        new URL(response.url()).searchParams.get('query') ===
                            query,
                );
                await input.fill('@' + query);
                assert.equal((await loaded).status(), 200);
                const option = page.getByRole('option', {
                    name: '@Morgan Alexandra Reed',
                    exact: true,
                });
                await option.waitFor();
                assert.equal(await page.getByRole('option').count(), count);
            }
            // Search failures keep the draft and cannot guess a recipient.
            await page.route('**/collaboration/members?**', (route) =>
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: '{"message":"Synthetic search failure"}',
                }),
            );
            await input.fill('@reed');
            await page
                .getByRole('status')
                .getByText('Could not load coworkers.', { exact: false })
                .waitFor();
            assert.equal(await input.inputValue(), '@reed');
            assert.equal(await page.getByRole('option').count(), 0);
            await page.unroute('**/collaboration/members?**');
            await input.fill('@nobody-matches');
            await page.waitForResponse(
                (response) =>
                    response.url().includes('/collaboration/members?') &&
                    new URL(response.url()).searchParams.get('query') ===
                        'nobody-matches',
            );
            assert.equal(await page.getByRole('option').count(), 0);

            await input.fill('@REED');
            const second = page.getByRole('option', {
                name: '@Morgan Willow Reed',
                exact: true,
            });
            await second.waitFor();
            await input.press('ArrowDown');
            assert.equal(await second.getAttribute('aria-selected'), 'true');
            await input.press('Escape');
            assert.equal(await page.getByRole('option').count(), 0);
            assert.equal(await input.inputValue(), '@REED');

            await input.fill('@xAnDr');
            await page
                .getByRole('option', {
                    name: '@Morgan Alexandra Reed',
                    exact: true,
                })
                .waitFor();
            if (evidence) {
                fs.mkdirSync(evidence, { recursive: true });
                await page.screenshot({
                    path: `${evidence}/picker-${width}.png`,
                    fullPage: true,
                    animations: 'disabled',
                });
            }
            await input.press('Enter');
            assert.equal(await input.inputValue(), '@Morgan Alexandra Reed ');
            await page
                .getByRole('button', {
                    name: 'Remove mention notification for Morgan Alexandra Reed',
                })
                .waitFor();
            // Selection restores the caret on the next animation frame.
            const selection = await input.evaluate(
                (element) =>
                    new Promise((resolve) =>
                        requestAnimationFrame(() =>
                            requestAnimationFrame(() =>
                                resolve({
                                    focused: element === document.activeElement,
                                    caret: element.selectionStart,
                                    length: element.value.length,
                                }),
                            ),
                        ),
                    ),
            );
            assert(selection.focused);
            assert.equal(selection.caret, selection.length);
            await input.press('End');
            await input.pressSequentially('review at ' + width);
            const sent = page.waitForResponse(
                (response) =>
                    response.request().method() === 'POST' &&
                    response.url().endsWith(`/chats/${identity.chat}/messages`),
            );
            await page
                .getByRole('button', { name: 'Send', exact: true })
                .click();
            const response = await sent;
            assert.equal(response.status(), 201);
            assert.deepEqual(response.request().postDataJSON().mentions, [
                identity.member,
            ]);
            const result = (await response.json()).data;
            assert.equal(
                result.body,
                '@Morgan Alexandra Reed review at ' + width,
            );
            assert.deepEqual(result.mentions, [
                { id: identity.member, name: 'Morgan Alexandra Reed' },
            ]);
            const row = page.locator(`article[data-message-id="${result.id}"]`);
            await row.getByText(result.body, { exact: true }).waitFor();
            assert.equal(
                await row.locator('mark').innerText(),
                '@Morgan Alexandra Reed',
            );
            assert(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                ),
            );
            console.log(
                `PASS ${width}px: partial mixed-case search, full-name picker/selection/send, keyboard, empty/error drafts and stable recipient ID`,
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
