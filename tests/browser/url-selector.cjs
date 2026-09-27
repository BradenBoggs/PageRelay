const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 1360, height: 900 },
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:8000/login');
    await page.locator('input[name="email"]').fill('selector@example.test');
    await page
        .locator('input[name="password"]')
        .fill('Selector-preview-ONLY-42!');
    await page
        .locator('form')
        .filter({ has: page.locator('input[name="password"]') })
        .locator('button[type="submit"]')
        .click();
    await page.waitForURL('**/dashboard');
    await page.goto('http://localhost:8000/chats');
    await page
        .locator('.sw-chat-row')
        .filter({ hasText: 'URL selector review' })
        .click();
    await page
        .locator('.sw-chat-heading h1')
        .filter({ hasText: 'URL selector review' })
        .waitFor();
    await page.getByRole('button', { name: 'Link Page', exact: true }).click();
    await page
        .getByRole('textbox', { name: 'Page URL', exact: true })
        .fill('https://crm.example/records/123/view?tab=notes&id=123');
    await page.getByRole('button', { name: 'Review URL', exact: true }).click();
    await page
        .locator('.um-summary strong')
        .filter({ hasText: 'Only this exact page' })
        .waitFor();
    const path = page.getByRole('button', {
        name: 'Use path through /123',
        exact: true,
    });
    await path.hover();
    assert.equal(await path.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('.um-preview').isVisible(), true);
    await path.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() =>
        document
            .querySelector('.um-chip[data-end="true"]')
            ?.textContent.includes('/123'),
    );
    assert.equal(
        await page
            .getByRole('button', { name: '?tab=notes', exact: false })
            .getAttribute('aria-pressed'),
        'false',
    );
    await page.getByRole('button', { name: '&id=123', exact: false }).click();
    assert.equal(
        await page
            .getByRole('button', { name: '&id=123', exact: false })
            .getAttribute('aria-pressed'),
        'true',
    );
    // Root selection must be explicitly confirmed, including when saved via keyboard.
    await page
        .getByRole('button', {
            name: 'Use path through https://crm.example',
            exact: true,
        })
        .click();
    assert.equal(
        await page
            .getByRole('button', { name: 'Link to chat', exact: true })
            .isDisabled(),
        true,
    );
    await path.click();
    for (const width of [1360, 390]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
        );
        await page.screenshot({
            path: `/tmp/selector-screenshots/selector-web-${width}.png`,
        });
    }
    await page
        .getByRole('button', { name: 'Link to chat', exact: true })
        .click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page
        .locator('.sw-linked-pages a')
        .filter({ hasText: 'crm.example' })
        .waitFor();

    const ext = await browser.newPage({
        viewport: { width: 360, height: 850 },
    });
    ext.on('pageerror', (error) => errors.push(error.message));
    const session = JSON.parse(
        fs.readFileSync('/tmp/selector-session.json', 'utf8'),
    );
    await ext.addInitScript(
        ({ session }) => {
            const listeners = [];
            let tab = {
                id: 5,
                windowId: 1,
                active: true,
                title: 'Extension record',
                url: 'https://crm.example/records/extension/view?tab=notes',
            };
            window.chrome = {
                storage: {
                    local: {
                        get: async () => ({
                            'sidewire.extension.session': session,
                        }),
                        set: async () => {},
                        remove: async () => {},
                    },
                },
                tabs: {
                    query: async () => [tab],
                    onActivated: {
                        addListener: () => {},
                        removeListener: () => {},
                    },
                    onUpdated: {
                        addListener: (fn) => listeners.push(fn),
                        removeListener: (fn) => {
                            const i = listeners.indexOf(fn);
                            if (i >= 0) listeners.splice(i, 1);
                        },
                    },
                },
            };
            window.navigateTab = (url) => {
                tab = { ...tab, url };
                listeners.forEach((fn) => fn(tab.id, { url }, tab));
            };
        },
        { session },
    );
    await ext.goto('http://localhost:8000/extension-fixture.html');
    await ext.locator('#create-chat-name').waitFor();
    await ext
        .getByRole('button', {
            name: 'Use path through /extension',
            exact: true,
        })
        .click();
    await ext.getByRole('button', { name: 'Create chat', exact: true }).click();
    await ext.locator('#message-body').waitFor();
    await ext.locator('#message-body').fill('Draft keeps the Notes source');
    await ext.evaluate(() =>
        window.navigateTab(
            'https://crm.example/records/extension/view?tab=files',
        ),
    );
    await ext
        .locator('a[href="https://crm.example/records/extension/view?tab=files"]')
        .first()
        .waitFor();
    await ext.locator('#message-body').waitFor();
    assert.equal(
        await ext.locator('#message-body').inputValue(),
        'Draft keeps the Notes source',
    );
    await ext.getByRole('button', { name: 'Send', exact: true }).click();
    await ext
        .getByText('Draft keeps the Notes source', { exact: true })
        .waitFor();
    assert.equal(
        await ext
            .getByRole('link', { name: 'Sent while viewing crm.example' })
            .getAttribute('href'),
        'https://crm.example/records/extension/view?tab=notes',
    );
    await ext.waitForFunction(
        () => document.querySelector('#message-body')?.value === '',
    );
    await ext.screenshot({
        path: '/tmp/selector-screenshots/extension-source-360.png',
    });
    await ext.getByRole('button', { name: 'Matching', exact: true }).click();
    await ext.getByRole('dialog').waitFor();
    await ext.locator('.um-selector').waitFor();
    await ext.screenshot({
        path: '/tmp/selector-screenshots/selector-extension-360.png',
    });
    assert.equal(
        await ext.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
    );
    await ext.keyboard.press('Escape');
    await ext.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.deepEqual(errors, []);
    console.log(
        'URL_SELECTOR_BROWSER_PASS: authenticated web review/link, preview-only hover, keyboard selection, independent query toggles, broad confirmation, 390px layout, real extension bundle with mocked Chrome metadata, 360px layout, frozen source across navigation, saved message source, matching dialog, zero page errors.',
    );
    await browser.close();
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
