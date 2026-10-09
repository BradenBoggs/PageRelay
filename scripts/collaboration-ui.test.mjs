import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Test the real display-only helper module. Transpilation is not a type check.
const source = fs.readFileSync(new URL('../resources/js/components/collaboration/presentation.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { initials, avatarTone, dayLabel, mentionAtCaret, mentionParts, sameMessageGroup, mergeMessages } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const message = (id, extra = {}) => ({ id, body: id, author: { id: 1, name: 'Sample User' }, created_at: '2026-10-08T10:00:00Z', thread_root_id: null, source: null, reply_count: 0, mentions: [], ...extra });

await test('initials are deterministic, trim whitespace and handle empty names', () => {
    assert.equal(initials('  Morgan   Reed  '), 'MR');
    assert.equal(initials('Braden'), 'B');
    assert.equal(initials(' '), '?');
    assert.equal(avatarTone('Morgan Reed'), avatarTone('Morgan Reed'));
    assert(avatarTone('Sample') >= 0 && avatarTone('Sample') < 5);
});
await test('calendar labels use today and yesterday rather than elapsed 24-hour windows', () => {
    const now = new Date(2026, 9, 8, 0, 10);
    assert.equal(dayLabel(new Date(2026, 9, 8, 0, 1).toISOString(), now), 'Today');
    assert.equal(dayLabel(new Date(2026, 9, 7, 0, 0).toISOString(), now), 'Yesterday');
    assert.equal(dayLabel('not-a-date', now), 'Date unavailable');
});
await test('same-author messages group only within five minutes and with identical source/thread context', () => {
    const first = message('a');
    assert(sameMessageGroup(first, message('b', { created_at: '2026-10-08T10:04:00Z' })));
    assert(!sameMessageGroup(first, message('b', { created_at: '2026-10-08T10:05:00Z' })));
    assert(!sameMessageGroup(first, message('b', { author: { id: 2, name: 'Other' } })));
    assert(!sameMessageGroup(first, message('b', { thread_root_id: 'root' })));
    assert(!sameMessageGroup(first, message('b', { source: { id: 'page-1' } })));
    assert(!sameMessageGroup(undefined, first));
});
await test('history refresh replaces matching IDs without dropping older loaded messages', () => {
    const result = mergeMessages([message('1'), message('2')], [message('2', { reply_count: 3 }), message('3')]);
    assert.deepEqual(result.map((item) => item.id), ['1', '2', '3']);
    assert.equal(result[1].reply_count, 3);
});
await test('older-page prepend keeps overlap unique and preserves current versions', () => {
    const result = mergeMessages([message('1'), message('2')], [message('2', { body: 'current' }), message('3')]);
    assert.deepEqual(result.map((item) => item.id), ['1', '2', '3']);
    assert.equal(result[1].body, 'current');
});
await test('mentions resolve at the caret, including in the middle of a draft', () => {
    const body = 'Please ask @Mor about this.';
    assert.deepEqual(mentionAtCaret(body, 15), { start: 11, end: 15, query: 'Mor' });
    assert.equal(mentionAtCaret('person@example.com', 18), null);
    assert.equal(mentionAtCaret('Hello\n', 6), null);
});
await test('plain @text does not become a highlighted or notified person', () => {
    assert.deepEqual(mentionParts('Hello @Morgan', []), [{ text: 'Hello @Morgan', mentioned: false }]);
    const parts = mentionParts('Hello @Morgan.', [{ id: 4, name: 'Morgan' }]);
    assert.equal(parts.filter((part) => part.mentioned)[0].text, '@Morgan');
    assert.equal(parts.map((part) => part.text).join(''), 'Hello @Morgan.');
});
await test('resolved mentions do not match email addresses or prefixes of longer names', () => {
    const people = [{ id: 1, name: 'Ann' }, { id: 2, name: 'Ann Smith' }];
    const parts = mentionParts('email@Ann is not @Anna. Ask @Ann Smith or @Ann.', people);
    assert.deepEqual(parts.filter((part) => part.mentioned).map((part) => part.text), ['@Ann Smith', '@Ann']);
});
await test('mention rendering preserves raw text and escapes regular-expression metacharacters', () => {
    const body = '<script>x</script> @A+B & @A+B.';
    const parts = mentionParts(body, [{ id: 9, name: 'A+B' }]);
    assert.equal(parts.map((part) => part.text).join(''), body);
    assert.equal(parts.filter((part) => part.mentioned).length, 2);
});
