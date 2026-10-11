const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const origin = process.env.INVITATION_TEST_ORIGIN || 'http://127.0.0.1:8029';
const codes = JSON.parse(fs.readFileSync(process.env.INVITATION_TEST_FIXTURES || '/private/tmp/sidewire-invitation-fixtures.json', 'utf8'));
const evidence = process.env.INVITATION_TEST_EVIDENCE || '/private/tmp/sidewire-invitation-browser-evidence';
(async () => {
    fs.mkdirSync(evidence, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    try {
        for (const [kind, width] of [['desktop', 1440], ['mobile', 390]]) {
            const context = await browser.newContext({ viewport: { width, height: 900 } });
            const page = await context.newPage();
            page.on('pageerror', (error) => errors.push(error.message));
            // Previously emailed login links must also open signup for a new account.
            await page.goto(`${origin}/login?invitation=${codes[kind]}`);
            await page.waitForURL('**/register?invitation=*');
            await page.getByRole('heading', { name: 'Create your account' }).waitFor();
            assert.equal(await page.getByLabel('Email address').inputValue(), `${kind}@example.test`);
            assert.equal(await page.getByLabel('Email address').getAttribute('readonly'), '');
            assert(await page.getByLabel('Name', { exact: true }).evaluate((element) => document.activeElement === element));
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            await page.getByLabel('Name', { exact: true }).fill('Invitation recipient');
            await page.getByLabel('Password', { exact: true }).fill('password');
            await page.getByLabel('Confirm password').fill('wrong');
            await page.getByRole('button', { name: 'Create account', exact: true }).click();
            await page.getByText('The password field confirmation does not match.').waitFor();
            await page.getByLabel('Confirm password').fill('password');
            await page.screenshot({ path: `${evidence}/signup-${width}.png`, fullPage: true });
            await page.getByRole('button', { name: 'Create account', exact: true }).click();
            await page.waitForURL('**/email/verify');
            await page.getByRole('button', { name: 'Resend verification email' }).waitFor();
            await page.screenshot({ path: `${evidence}/verification-${width}.png`, fullPage: true });
            await context.close();
        }
        const context = await browser.newContext();
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${origin}/register?invitation=${codes.existing}`);
        await page.waitForURL('**/login?invitation=*');
        await page.getByLabel('Email address').fill('existing@example.test');
        await page.getByLabel('Password', { exact: true }).fill('password');
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.waitForURL('**/settings/profile');
        await page.getByRole('button', { name: 'Accept', exact: true }).click();
        await page.waitForURL('**/messages');
        await context.close();
        const guest = await browser.newPage();
        const publicSignup = await guest.goto(origin + '/register');
        assert.equal(publicSignup.status(), 404);
        assert.deepEqual(errors, []);
        console.log('PASS: desktop/mobile old invite links open signup; fixed invited email; focus/no overflow; validation/retry; signup reaches email verification; existing account login/accept reaches Messages; public signup stays unavailable; no page errors.');
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
