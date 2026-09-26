import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    segmentUrl,
    canSaveSelection,
    selectionFor,
    isBroad,
} from '../../packages/page-contexts/url-selection.ts';

test('segments path and query in their original order, retaining encoded separators', () => {
    const parts = segmentUrl(
        'https://crm.example/records/a%2Fb/view?tab=notes&id=a%26b&id=2',
    );
    assert.deepEqual(parts.segments, ['records', 'a%2Fb', 'view']);
    assert.deepEqual(
        parts.query.map(({ key, value }) => [key, value]),
        [
            ['tab', 'notes'],
            ['id', 'a&b'],
            ['id', '2'],
        ],
    );
});
test('exact default and broad scope confirmation are conservative', () => {
    assert.deepEqual(selectionFor(null), { mode: 'exact' });
    const broad = { mode: 'prefix', path_depth: 0, query_keys: [] };
    assert.equal(isBroad(broad), true);
    assert.equal(
        canSaveSelection('https://crm.example/records/12', broad),
        false,
    );
    assert.equal(
        canSaveSelection('https://crm.example/records/12', {
            ...broad,
            confirm_broad: true,
        }),
        true,
    );
    assert.equal(
        canSaveSelection('https://crm.example/record?id=12', {
            mode: 'prefix',
            path_depth: 1,
            query_keys: ['id'],
        }),
        true,
    );
});
test('unsupported routes, credentials and missing selected parameters cannot be saved', () => {
    for (const url of [
        'javascript:alert(1)',
        'https://user:pass@crm.example/records/1',
        'https://crm.example/#/records/1',
    ])
        assert.equal(segmentUrl(url), null);
    assert.equal(
        canSaveSelection('https://crm.example/record', {
            mode: 'prefix',
            path_depth: 1,
            query_keys: ['id'],
        }),
        false,
    );
    assert.equal(
        canSaveSelection('https://crm.example/record?utm_source=email', {
            mode: 'prefix',
            path_depth: 1,
            query_keys: ['utm_source'],
        }),
        false,
    );
});
