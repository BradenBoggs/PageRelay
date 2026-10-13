const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { chromium } = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/private/tmp/sidewire-edit-browser/package.json',
)('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://127.0.0.1:18016';
const identity = JSON.parse(
    fs.readFileSync(
        process.env.SIDEWIRE_CONTROLS_IDENTITY ||
            '/private/tmp/sidewire-controls-browser/identity.json',
    ),
);
(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const errors = [];
    const member = await browser.newPage();
    const owner = await browser.newPage();
    for (const page of [member, owner])
        page.on('pageerror', (error) => errors.push(error.message));
    await member.addInitScript(() => {
        window.soundStarts = 0;
        const original = Object.getOwnPropertyDescriptor(
            AudioContext.prototype,
            'createOscillator',
        ).value;
        AudioContext.prototype.createOscillator = function () {
            const oscillator = original.call(this);
            const start = oscillator.start.bind(oscillator);
            oscillator.start = (...args) => {
                window.soundStarts++;
                start(...args);
            };
            return oscillator;
        };
    });
    async function login(page, email) {
        await page.goto(origin + '/login');
        await page.getByLabel('Email address').fill(email);
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/messages');
        await page.waitForResponse((response) =>
            response.url().endsWith('/collaboration/updates'),
        );
    }
    async function api(page, path, data) {
        return page.evaluate(
            async ({ path, data }) => {
                const csrf = decodeURIComponent(
                    document.cookie
                        .split('; ')
                        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
                        .slice(11),
                );
                const response = await fetch(path, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': csrf,
                    },
                    body: JSON.stringify(data),
                });
                return { status: response.status, data: await response.json() };
            },
            { path, data },
        );
    }
    async function refresh(page) {
        const response = page.waitForResponse((response) =>
            response.url().includes('/collaboration/updates?after='),
        );
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await response;
    }
    try {
        await login(member, 'controls-member@example.test');
        await member
            .getByRole('link', { name: 'Work chats', exact: true })
            .click();
        await member.getByText('1 unread', { exact: true }).waitFor();
        assert.equal(
            await member
                .getByRole('button', { name: 'Create chat', exact: true })
                .count(),
            0,
        );
        assert.equal(await member.evaluate(() => window.soundStarts), 0);
        await login(owner, 'controls-owner@example.test');
        await owner.goto(origin + '/chats');
        for (const width of [1440, 390]) {
            await owner.setViewportSize({ width, height: 900 });
            await owner
                .getByRole('button', { name: 'Create chat', exact: true })
                .click();
            const create = owner.getByRole('dialog', {
                name: 'Create chat',
                exact: true,
            });
            await create
                .getByLabel('Chat name', { exact: true })
                .fill('Admin work chat ' + width);
            await create
                .getByRole('button', { name: 'Create chat', exact: true })
                .click();
            await create.waitFor({ state: 'hidden' });
            await owner
                .getByRole('button', { name: 'Edit work chat', exact: true })
                .click();
            const edit = owner.getByRole('dialog', {
                name: 'Edit work chat',
                exact: true,
            });
            await edit
                .getByLabel('Chat name', { exact: true })
                .fill('Cancelled name');
            await edit
                .getByRole('button', { name: 'Cancel', exact: true })
                .click();
            await owner
                .getByRole('heading', {
                    name: 'Admin work chat ' + width,
                    exact: true,
                })
                .first()
                .waitFor();
            await owner
                .getByRole('button', { name: 'Edit work chat', exact: true })
                .click();
            await edit
                .getByLabel('Chat name', { exact: true })
                .fill('Updated work chat ' + width);
            await owner.route('**/collaboration/chats/*', (route) =>
                route.request().method() === 'PATCH'
                    ? route.fulfill({
                          status: 500,
                          contentType: 'application/json',
                          body: JSON.stringify({
                              message: 'Temporary rename failure',
                          }),
                      })
                    : route.continue(),
            );
            await edit
                .getByRole('button', { name: 'Save changes', exact: true })
                .click();
            await edit.getByRole('alert').waitFor();
            assert.equal(
                await edit
                    .getByLabel('Chat name', { exact: true })
                    .inputValue(),
                'Updated work chat ' + width,
            );
            await owner.unroute('**/collaboration/chats/*');
            await edit
                .getByRole('button', { name: 'Save changes', exact: true })
                .click();
            await edit.waitFor({ state: 'hidden' });
            await owner
                .getByRole('heading', {
                    name: 'Updated work chat ' + width,
                    exact: true,
                })
                .first()
                .waitFor();
            assert.equal(
                await owner.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                ),
                true,
            );
            if (process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR) {
                fs.mkdirSync(process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR, {
                    recursive: true,
                });
                await owner.screenshot({
                    path: `${process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR}/work-chat-${width}.png`,
                });
            }
            await owner.goto(origin + '/chats');
        }
        await member.setViewportSize({ width: 1440, height: 900 });
        await member.bringToFront();
        await member
            .getByRole('heading', { name: 'Chats', exact: true })
            .click();
        const sent = await api(
            owner,
            `/collaboration/chats/${identity.chat}/messages`,
            {
                body: 'New incoming from owner',
                idempotency_key: require('node:crypto').randomUUID(),
                mentioned_user_ids: [],
            },
        );
        assert.equal(sent.status, 201);
        await refresh(member);
        await member.getByText('2 unread', { exact: true }).waitFor();
        await member.waitForFunction(() => window.soundStarts === 1);
        await refresh(member);
        assert.equal(await member.evaluate(() => window.soundStarts), 1);
        const own = await api(
            member,
            `/collaboration/chats/${identity.chat}/messages`,
            {
                body: 'My own message',
                idempotency_key: require('node:crypto').randomUUID(),
                mentioned_user_ids: [],
            },
        );
        assert.equal(own.status, 201);
        await refresh(member);
        assert.equal(await member.evaluate(() => window.soundStarts), 1);
        await member.goto(origin + '/messages?chat=' + identity.chat);
        await member
            .getByRole('heading', { name: 'Unread review', exact: true })
            .waitFor();
        assert.equal(
            await member
                .getByRole('button', { name: 'Edit work chat', exact: true })
                .count(),
            0,
        );
        await member.bringToFront();
        await member
            .getByRole('textbox', { name: 'Message', exact: true })
            .focus();
        await member.waitForResponse(
            (response) =>
                response.url().endsWith('/read') &&
                response.request().method() === 'POST',
        );
        await refresh(member);
        const counts = await member.evaluate(
            async () =>
                (await (await fetch('/collaboration/updates')).json())
                    .unread_counts,
        );
        assert.equal(counts[identity.chat], 0);
        assert.deepEqual(errors, []);
        console.log(
            'Admin creation/name editing, member controls, unread/read counts and incoming audio synthesis passed at desktop/mobile widths.',
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
