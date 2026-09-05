#!/usr/bin/env bash

set -euo pipefail

readonly SEARCH_PATHS=(
    app
    bootstrap
    config
    database
    resources
    routes
    tests
)

readonly FORBIDDEN_PATTERNS=(
    'current_team_id'
    'current_organization_id'
    'switchTeam'
    'switchOrganization'
    'personal_team'
    'personal_organization'
)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    set +e

    if command -v rg >/dev/null 2>&1; then
        rg --line-number --hidden --glob '!*.map' "$pattern" "${SEARCH_PATHS[@]}"
        search_status=$?
    else
        grep --recursive --line-number --exclude='*.map' -- "$pattern" "${SEARCH_PATHS[@]}"
        search_status=$?
    fi

    set -e

    if [[ $search_status -eq 0 ]]; then
        echo "Forbidden foundation symbol found: $pattern" >&2
        exit 1
    fi

    if [[ $search_status -ne 1 ]]; then
        echo "Foundation boundary search failed for: $pattern" >&2
        exit 2
    fi
done

echo 'Foundation boundary check passed.'
