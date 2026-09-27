export type UrlSelection = {
    mode: 'exact' | 'prefix';
    path_depth?: number;
    query_keys?: string[];
    confirm_broad?: boolean;
};

export type UrlMatchDefinition = {
    version: number;
    origin: string;
    path: string;
    path_depth: number;
    query: Array<{ key: string; values: string[] }>;
};

const tracking = new Set([
    'dclid',
    'fbclid',
    'gclid',
    'gbraid',
    'mc_cid',
    'mc_eid',
    'msclkid',
    'wbraid',
]);
export function isTracking(key: string): boolean {
    return (
        key.toLowerCase().startsWith('utm_') || tracking.has(key.toLowerCase())
    );
}

/** Display only. The server repeats URL safety, scope, and conflict validation. */
export function segmentUrl(value: string) {
    if (!/^https?:\/\//i.test(value) || /[\s\\]/.test(value)) return null;
    try {
        const url = new URL(value);
        if (
            url.username ||
            url.password ||
            /^(?:!|\/)|[?=&]/.test(url.hash.slice(1))
        )
            return null;
        const path = url.pathname.replace(/\/+$/, '');
        const segments = path === '' ? [] : path.slice(1).split('/');
        const query = Array.from(url.searchParams.entries(), ([key, val]) => ({
            key,
            value: val,
            tracking: isTracking(key),
        }));
        return {
            origin: url.origin,
            segments,
            query,
            fragment: url.hash,
            pathname: url.pathname,
        };
    } catch {
        return null;
    }
}

export function selectionFor(
    definition: UrlMatchDefinition | null | undefined,
): UrlSelection {
    return definition
        ? {
              mode: 'prefix',
              path_depth: definition.path_depth,
              query_keys: definition.query.map((entry) => entry.key),
              confirm_broad: false,
          }
        : { mode: 'exact' };
}

export function isBroad(selection: UrlSelection): boolean {
    return (
        selection.mode === 'prefix' &&
        (selection.path_depth ?? 0) < 2 &&
        !selection.query_keys?.length
    );
}

export function canSaveSelection(
    url: string,
    selection: UrlSelection,
): boolean {
    const parts = segmentUrl(url);
    return Boolean(
        parts &&
        (selection.mode === 'exact' ||
            (Number.isInteger(selection.path_depth) &&
                selection.path_depth! >= 0 &&
                selection.path_depth! <= parts.segments.length &&
                (selection.query_keys ?? []).every((key) =>
                    parts.query.some(
                        (pair) => pair.key === key && !pair.tracking,
                    ),
                ) &&
                (!isBroad(selection) || selection.confirm_broad))),
    );
}
