#!/usr/bin/env bash
# PostToolUse: formats files and lints source files changed since the last tool call, so a broken rule shows at once
set -uo pipefail

input=$(cat)
session=$(jq -r '.session_id // empty' <<<"$input" | tr -cd 'A-Za-z0-9-')
# Not CLAUDE_PROJECT_DIR: in a worktree session it is the main checkout
cd "$(jq -r '.cwd // empty' <<<"$input")" 2>/dev/null && cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

# One "hash  path" line per uncommitted source file; a file is checked again only when its hash changes
linted_file="node_modules/.cache/claude-linted-${session:-default}"
mkdir -p node_modules/.cache
touch "$linted_file"

hashes() {
  git ls-files -z --modified --others --exclude-standard -- src e2e |
    xargs -0 -r shasum -- 2>/dev/null | grep -v '\.gen\.ts$' | sort
}

files=$(comm -13 "$linted_file" <(hashes) | awk '{print $2}')
if [ -z "$files" ]; then
  hashes >"$linted_file"
  exit 0
fi

# shellcheck disable=SC2086
bunx oxfmt --no-error-on-unmatched-pattern $files >/dev/null 2>&1
hashes >"$linted_file"
files=$(grep -E '\.tsx?$' <<<"$files") || exit 0

# Unused names are normal halfway through a change; bun run check still reports them
# shellcheck disable=SC2086
output=$(NO_COLOR=1 bunx oxlint --deny-warnings -A no-unused-vars $files 2>&1) && exit 0

echo "$output" | tail -n 40 >&2
# Only exit 2 sends stderr to Claude
exit 2
