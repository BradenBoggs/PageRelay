const { createRequire } = require('node:module');
const path = require('node:path');
const browserRequire = createRequire('/tmp/pilot-browser/package.json');
const { chromium } = browserRequire('playwright');

(async () => {
    const extensionPath = path.resolve('apps/extension/dist');
    const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        headless: true,
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
        ],
    });
    try {
        const worker =
            context.serviceWorkers()[0] ||
            (await context.waitForEvent('serviceworker'));
        const id = new URL(worker.url()).host;
        if (!/^[a-p]{32}$/.test(id)) throw new Error('Invalid extension ID.');
        console.log(id);
    } finally {
        await context.close();
    }
})().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
