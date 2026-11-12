#!/usr/bin/env bash
# PostToolUse: lints source files changed since the last tool call, so a broken rule shows at once
set -uo pipefail

session=$(jq -r '.session_id // empty' | tr -cd 'A-Za-z0-9-')
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

# One "hash  path" line per uncommitted source file; a file is linted again only when its hash changes
linted_file="node_modules/.cache/claude-linted-${session:-default}"
mkdir -p node_modules/.cache
touch "$linted_file"

current=$(git ls-files -z --modified --others --exclude-standard -- src e2e |
  xargs -0 -r shasum -- 2>/dev/null | grep -E '\.tsx?$' | grep -v '\.gen\.ts$' | sort)
files=$(comm -13 "$linted_file" <(echo "$current") | awk '{print $2}')
echo "$current" >"$linted_file"
[ -z "$files" ] && exit 0

# Unused names are normal halfway through a change; bun run check still reports them
# shellcheck disable=SC2086
output=$(NO_COLOR=1 bunx oxlint --deny-warnings -A no-unused-vars $files 2>&1) && exit 0

echo "$output" | tail -n 40 >&2
# Only exit 2 sends stderr to Claude
exit 2
