import { useId, useState } from 'react';
import { isBroad, segmentUrl, type UrlSelection } from './url-selection';
import './url-match-selector.css';

export function UrlMatchSelector({
    url,
    value,
    onChange,
    disabled = false,
}: {
    url: string;
    value: UrlSelection;
    onChange: (selection: UrlSelection) => void;
    disabled?: boolean;
}) {
    const id = useId();
    const [hover, setHover] = useState<number | null>(null);
    const [focus, setFocus] = useState<number | null>(null);
    const parts = segmentUrl(url);
    if (!parts)
        return (
            <p className="um-error" role="status">
                Enter a standard HTTP or HTTPS URL. Fragment-routed pages are
                not supported yet.
            </p>
        );
    const depth =
        value.mode === 'exact'
            ? parts.segments.length
            : (value.path_depth ?? 0);
    const preview = hover ?? focus;
    const highlighted = preview ?? depth;
    const keys =
        value.mode === 'exact'
            ? [
                  ...new Set(
                      parts.query
                          .filter((pair) => !pair.tracking)
                          .map((pair) => pair.key),
                  ),
              ]
            : (value.query_keys ?? []);
    const prefix =
        parts.origin +
        (depth ? '/' + parts.segments.slice(0, depth).join('/') : '/');
    const chosenQuery = new URLSearchParams();
    parts.query.forEach((pair) => {
        if (keys.includes(pair.key)) chosenQuery.append(pair.key, pair.value);
    });
    const address =
        (value.mode === 'exact' ? parts.origin + parts.pathname : prefix) +
        (chosenQuery.size ? '?' + chosenQuery.toString() : '');
    function selectPath(next: number) {
        onChange({
            mode: 'prefix',
            path_depth: next,
            query_keys: [],
            confirm_broad: false,
        });
    }
    function toggleQuery(key: string) {
        onChange({
            mode: 'prefix',
            path_depth: depth,
            query_keys: keys.includes(key)
                ? keys.filter((item) => item !== key)
                : [...keys, key],
            confirm_broad: false,
        });
    }
    return (
        <fieldset
            className="um-selector"
            disabled={disabled}
            aria-describedby={`${id}-help`}
        >
            <legend>Where should this chat appear?</legend>
            <p id={`${id}-help`}>
                Select the last path section that identifies this record. Query
                parameters can be included separately.
            </p>
            <div
                className="um-segments"
                role="group"
                aria-label="URL path sections"
                onMouseLeave={() => setHover(null)}
            >
                {[
                    parts.origin,
                    ...parts.segments.map((part) => '/' + part),
                ].map((label, index) => (
                    <button
                        key={index}
                        type="button"
                        className="um-chip"
                        data-used={index <= highlighted}
                        data-end={value.mode === 'prefix' && index === depth}
                        aria-pressed={
                            value.mode === 'prefix' && index === depth
                        }
                        aria-label={`Use path through ${label}`}
                        title={label}
                        onMouseEnter={() => setHover(index)}
                        onFocus={() => setFocus(index)}
                        onBlur={() => setFocus(null)}
                        onClick={() => selectPath(index)}
                    >
                        {label}
                        <span className="um-marker" aria-hidden="true">
                            {value.mode === 'prefix' && index === depth
                                ? ' ✓'
                                : ''}
                        </span>
                    </button>
                ))}
            </div>
            {parts.query.length > 0 && (
                <div
                    className="um-segments"
                    role="group"
                    aria-label="Required query parameters"
                >
                    {parts.query.map((pair, index) => (
                        <button
                            key={index}
                            type="button"
                            className="um-chip"
                            data-used={
                                !pair.tracking && keys.includes(pair.key)
                            }
                            aria-pressed={
                                !pair.tracking && keys.includes(pair.key)
                            }
                            disabled={disabled || pair.tracking}
                            title={
                                pair.tracking
                                    ? 'Tracking parameter: always ignored'
                                    : 'Toggle all values for ' + pair.key
                            }
                            onClick={() => toggleQuery(pair.key)}
                        >
                            {index === 0 ? '?' : '&'}
                            {pair.key}={pair.value}
                            <span className="um-marker" aria-hidden="true">
                                {keys.includes(pair.key) ? ' ✓' : ''}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            <div className="um-legend">
                <span>✓ Selected</span>
                <span>Muted sections are ignored for matching</span>
            </div>
            <p className="um-preview">
                Hover or focus a path section to preview. Click or press Enter
                to select; nothing is saved yet.
            </p>
            <div className="um-summary" role="status" aria-live="polite">
                <strong>
                    {value.mode === 'exact'
                        ? 'Only this exact page'
                        : depth === 0
                          ? 'Paths on this website'
                          : 'This path and its subpages'}
                </strong>
                <code>{address}</code>
                <p>
                    {value.mode === 'exact'
                        ? 'All non-tracking query parameters must match. Ordinary #anchors are ignored.'
                        : `${keys.length} query ${keys.length === 1 ? 'parameter is' : 'parameters are'} required. Other parameters can change without switching chats. The origin and selected path must stay the same.`}
                </p>
            </div>
            {parts.query.some(
                (pair, index) =>
                    parts.query.findIndex((other) => other.key === pair.key) !==
                    index,
            ) && (
                <p>
                    Repeated query names are selected together; all of their
                    values must match.
                </p>
            )}
            {isBroad(value) && (
                <label className="um-warning">
                    <input
                        type="checkbox"
                        checked={value.confirm_broad ?? false}
                        onChange={(event) =>
                            onChange({
                                ...value,
                                confirm_broad: event.target.checked,
                            })
                        }
                    />
                    <span>
                        I understand this is a broad scope and may include
                        multiple records. Use a deeper path or a record-ID
                        parameter to narrow it.
                    </span>
                </label>
            )}
            <button
                type="button"
                className="um-reset"
                onClick={() => {
                    setHover(null);
                    setFocus(null);
                    onChange({ mode: 'exact' });
                }}
            >
                Use exact page instead
            </button>
            <p className="um-note">
                Ignored for matching does not mean removed from a message’s
                source link. Saving is a separate action.
            </p>
        </fieldset>
    );
}
