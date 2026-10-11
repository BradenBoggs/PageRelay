const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const { chromium } = createRequire(process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE)(
    'playwright',
);
const origin = process.env.SIDEWIRE_BROWSER_URL;
const { chat } = JSON.parse(
    fs.readFileSync(process.env.SIDEWIRE_THREAD_IDENTITY, 'utf8'),
);
const evidence = process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR;

// Requires a disposable shared chat and verified thread-owner@example.test.
(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const errors = [];
    try {
        const page = await browser.newPage({
            viewport: { width: 1440, height: 900 },
        });
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(origin + '/login');
        await page
            .getByLabel('Email address')
            .fill('thread-owner@example.test');
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        const xsrf = (await page.context().cookies(origin)).find(
            (cookie) => cookie.name === 'XSRF-TOKEN',
        );
        const headers = {
            Accept: 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(xsrf.value),
            Origin: origin,
        };
        async function send(body, extra = {}) {
            const response = await page.request.post(
                `${origin}/collaboration/chats/${chat}/messages`,
                {
                    headers,
                    data: { body, idempotency_key: randomUUID(), ...extra },
                },
            );
            assert.equal(response.status(), 201);
            return (await response.json()).data.id;
        }
        const first = await send('Confirm the delivery date');
        const second = await send('Review the updated quote');
        await send('The delivery date is confirmed', { thread_root_id: first });
        await send('The quote is ready', { thread_root_id: second });
        await page.goto(`${origin}/messages?chat=${chat}`);
        const main = page.locator('.sw-main-stream');
        const row = (id) => main.locator(`article[data-message-id="${id}"]`);
        await row(first).waitFor();
        assert.equal(await main.locator('[aria-current]').count(), 0);
        const draft = main.getByRole('textbox', {
            name: 'Message',
            exact: true,
        });
        await draft.fill('Keep my main chat draft');

        await row(first)
            .getByRole('button', { name: '1 reply', exact: true })
            .click();
        await page
            .getByText('The delivery date is confirmed', { exact: true })
            .waitFor();
        async function expectCurrent(id) {
            await page.waitForFunction(
                (id) =>
                    document
                        .querySelector(
                            '.sw-main-stream article[aria-current="true"]',
                        )
                        ?.getAttribute('data-message-id') === id,
                id,
            );
            assert.equal(await main.locator('.sw-thread-active').count(), 1);
            assert.equal(await row(id).getAttribute('aria-current'), 'true');
            const style = await row(id).evaluate((element) => {
                const computed = getComputedStyle(element);
                return {
                    background: computed.backgroundColor,
                    outline: computed.outlineStyle,
                };
            });
            assert.equal(style.outline, 'solid');
            assert.notEqual(style.background, 'rgba(0, 0, 0, 0)');
            return style;
        }
        const style = await expectCurrent(first);
        await row(first).hover();
        assert.equal(
            await row(first).evaluate(
                (element) => getComputedStyle(element).backgroundColor,
            ),
            style.background,
        );
        await row(first)
            .getByRole('button', { name: '1 reply', exact: true })
            .focus();
        assert.equal(
            await row(first).evaluate(
                (element) => getComputedStyle(element).backgroundColor,
            ),
            style.background,
        );
        const replies = page.getByRole('region', { name: 'Thread replies' });
        assert.equal(await replies.locator('.sw-thread-active').count(), 0);
        if (evidence) {
            fs.mkdirSync(evidence, { recursive: true });
            await page.screenshot({
                path: `${evidence}/highlight-1440.png`,
                fullPage: true,
                animations: 'disabled',
            });
        }

        await row(second)
            .getByRole('button', { name: '1 reply', exact: true })
            .click();
        await page.getByText('The quote is ready', { exact: true }).waitFor();
        await expectCurrent(second);
        assert.equal(await row(first).getAttribute('aria-current'), null);
        await page
            .locator('.sw-thread-pane')
            .getByRole('button', { name: 'Back to chat', exact: true })
            .click();
        assert.equal(await main.locator('.sw-thread-active').count(), 0);
        assert.equal(await main.locator('[aria-current]').count(), 0);
        assert.equal(await draft.inputValue(), 'Keep my main chat draft');

        await row(first)
            .getByRole('button', { name: '1 reply', exact: true })
            .click();
        await expectCurrent(first);
        await page.setViewportSize({ width: 390, height: 900 });
        await page.waitForFunction(
            () =>
                document
                    .querySelector('.sw-conversation-stage')
                    ?.getAttribute('data-split') === 'false',
        );
        assert.equal(await main.locator('.sw-thread-active').count(), 0);
        assert.equal(await main.isVisible(), false);
        await replies
            .getByText('The delivery date is confirmed', { exact: true })
            .waitFor();
        if (evidence)
            await page.screenshot({
                path: `${evidence}/thread-390.png`,
                fullPage: true,
                animations: 'disabled',
            });
        assert(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
            ),
        );
        await page.setViewportSize({ width: 1440, height: 900 });
        await expectCurrent(first);
        await page
            .locator('.sw-thread-pane')
            .getByRole('button', { name: 'Back to chat', exact: true })
            .click();
        assert.equal(await main.locator('.sw-thread-active').count(), 0);

        // A deleted root keeps its anonymous muted visuals even when current.
        const deleted = await send('Deleted thread root');
        await send('Retained reply', { thread_root_id: deleted });
        assert.equal(
            (
                await page.request.delete(
                    `${origin}/collaboration/chats/${chat}/messages/${deleted}`,
                    { headers },
                )
            ).status(),
            200,
        );
        await page.goto(`${origin}/messages?chat=${chat}`);
        await row(deleted)
            .getByRole('button', { name: 'Message deleted', exact: true })
            .click();
        await expectCurrent(deleted);
        assert.equal(
            (await row(deleted).innerText()).trim(),
            'Message deleted',
        );
        assert.equal(
            await row(deleted)
                .locator('header,time,a,.sw-message-avatar,.sw-message-actions')
                .count(),
            0,
        );
        const muted = await row(deleted).evaluate((element) => {
            const computed = getComputedStyle(element);
            return { color: computed.color, outline: computed.outlineColor };
        });
        assert.equal(muted.color, muted.outline);
        assert.deepEqual(errors, []);
        console.log(
            'PASS: split-view current root, hover/focus, switching, closing, resize to 390px/back, retained draft and anonymous deleted root',
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
