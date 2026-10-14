import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

await test('extension delivers contextual claims and opens the exact message/thread without acknowledging reading', async () => {
    const listeners = {};
    const event = (name) => ({
        addListener: (handler) => {
            listeners[name] = handler;
        },
    });
    const session = {
        token: 'disposable-token',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        user: { id: 1 },
        organization: { id: 2 },
    };
    const stored = {
        'sidewire.extension.session': session,
        'sidewire.desktop.enabled': true,
    };
    const notices = [];
    const opened = [];
    const requests = [];
    const chrome = {
        storage: {
            local: {
                get: async () => structuredClone(stored),
                set: async (values) => Object.assign(stored, values),
                remove: async (keys) => {
                    for (const key of [].concat(keys)) delete stored[key];
                },
            },
            onChanged: event('storage'),
        },
        permissions: { contains: async () => true },
        alarms: {
            get: async () => true,
            create: async () => {},
            clear: async () => {},
            onAlarm: event('alarm'),
        },
        notifications: {
            getPermissionLevel: async () => 'granted',
            getAll: async () => ({}),
            create: async (id, options) => {
                notices.push({ id, ...options });
            },
            clear: async () => {},
            onClicked: event('click'),
        },
        runtime: {
            id: 'review-extension',
            getURL: (path) => 'chrome-extension://review/' + path,
            onInstalled: event('installed'),
            onStartup: event('startup'),
            onMessage: event('message'),
        },
        sidePanel: { setPanelBehavior: async () => {} },
        tabs: {
            create: async (options) => {
                opened.push(options.url);
            },
        },
    };
    const notice = {
        id: 'attention',
        claim: 'lease',
        title: 'Review Sender mentioned you in Dispatch',
        body: 'Please review the pickup time.',
        path: '/messages?chat=chat&thread=root&message=reply',
    };
    const fetch = async (url, options) => {
        requests.push({ url, ...options });
        const data = url.endsWith('/notifications')
            ? { enabled: true, desktop_candidates: ['attention'] }
            : url.endsWith('/claim')
              ? { data: notice }
              : { ok: true };
        return { ok: true, status: 200, json: async () => data };
    };
    const source = fs
        .readFileSync(
            new URL(
                '../apps/extension/src/background/service-worker.ts',
                import.meta.url,
            ),
            'utf8',
        )
        .replace(
            'import.meta.env.VITE_SIDEWIRE_APP_URL',
            "'https://sidewire.example.test'",
        );
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
        },
    });
    vm.runInNewContext(outputText, {
        chrome,
        fetch,
        exports: {},
        structuredClone,
        Date,
    });
    // Chrome listeners are deliberately fire-and-forget; wait for observable completion.
    listeners.alarm({ name: 'sidewire.notifications' });
    for (
        let turn = 0;
        turn < 30 &&
        !requests.some((request) => request.url.endsWith('/delivered'));
        turn++
    )
        await new Promise(setImmediate);
    assert.equal(notices.length, 1);
    assert.equal(notices[0].title, notice.title);
    assert.equal(notices[0].message, notice.body);
    assert.equal(requests.at(-1).body, JSON.stringify({ claim: notice.claim }));
    assert.ok(requests.every((request) => !request.url.endsWith('/read')));
    listeners.click(notices[0].id);
    for (let turn = 0; turn < 30 && !opened.length; turn++)
        await new Promise(setImmediate);
    assert.deepEqual(opened, ['https://sidewire.example.test' + notice.path]);
    assert.ok(requests.every((request) => !request.url.endsWith('/read')));
});
