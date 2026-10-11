const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const browserRequire = createRequire(
    process.env.SIDEWIRE_PLAYWRIGHT_PACKAGE ||
        '/tmp/pilot-browser/package.json',
);
const { chromium } = browserRequire('playwright');
const origin = process.env.SIDEWIRE_BROWSER_URL || 'http://localhost:8000';
const evidence = process.env.SIDEWIRE_BROWSER_EVIDENCE_DIR;

// Requires disposable verified owner/invitee fixtures, with a pending invitation.
async function login(page, email) {
    await page.goto(origin + '/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

async function navigation(page, width, hasOrganization) {
    if (width < 768) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
    }
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await nav.waitFor();
    assert.equal(await nav.getByRole('link', { name: 'Overview' }).count(), 0);
    assert.equal(await nav.locator('a[href*="dashboard"]').count(), 0);
    assert.equal(
        await nav.getByRole('link', { name: 'Messages', exact: true }).count(),
        hasOrganization ? 1 : 0,
    );
    if (width < 768) {
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
    }
}

async function screenshot(page, name) {
    await page.waitForLoadState('networkidle');
    assert.equal(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
    );
    if (evidence) {
        fs.mkdirSync(evidence, { recursive: true });
        await page.screenshot({
            path: path.join(evidence, name + '.png'),
            fullPage: true,
        });
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    try {
        for (const width of [1440, 390]) {
            const page = await browser.newPage({
                viewport: { width, height: 900 },
            });
            page.on('pageerror', (error) => errors.push(error.message));
            await login(page, 'owner@example.test');
            await page.waitForURL('**/messages');
            await navigation(page, width, true);
            await page.goto(origin + '/dashboard');
            await page.waitForURL('**/messages');
            await page
                .getByText('A place for every conversation', { exact: true })
                .waitFor();
            await screenshot(page, `messages-${width}`);
            await page.close();

            const invitee = await browser.newPage({
                viewport: { width, height: 900 },
            });
            invitee.on('pageerror', (error) => errors.push(error.message));
            await login(invitee, 'invitee@example.test');
            await invitee.waitForURL('**/settings/profile');
            const invitations = invitee.getByRole('region', {
                name: 'Organization invitations',
            });
            await invitations
                .getByText('Preview Owner invited you to Preview Owner Company')
                .waitFor();
            assert.equal(
                await invitations
                    .getByRole('button', { name: 'Accept', exact: true })
                    .isVisible(),
                true,
            );
            assert.equal(
                await invitations
                    .getByRole('button', { name: 'Decline', exact: true })
                    .isVisible(),
                true,
            );
            await navigation(invitee, width, false);
            await invitee.goto(origin + '/dashboard');
            await invitee.waitForURL('**/settings/profile');
            await screenshot(invitee, `invitations-${width}`);
            if (width === 390) {
                await invitations
                    .getByRole('button', { name: 'Accept', exact: true })
                    .click();
                await invitee.waitForURL('**/messages');
                await navigation(invitee, width, true);
            }
            await invitee.close();
        }
        assert.deepEqual(errors, []);
        console.log(
            'No-Overview checks passed at 1440px and 390px: member Messages landing, legacy redirects, no Overview links, Profile invitations and mobile acceptance, no overflow or page errors.',
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
