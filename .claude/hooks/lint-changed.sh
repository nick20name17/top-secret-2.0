#!/usr/bin/env bash
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

# A new comment is reported once; after that, keeping it is the agent's decision
seen_file="node_modules/.cache/claude-comments-${session:-default}"
touch "$seen_file"
comment_lines() {
  grep -E '^[[:space:]]*(//|/\*|\*|\{/\*)' |
    grep -vE '(oxlint|eslint)-disable|@ts-expect-error' | sed 's/^[[:space:]]*//' | sort -u
}
comments=$(for file in $files; do
  comm -13 <(git show "HEAD:$file" 2>/dev/null | comment_lines) <(comment_lines <"$file") | sed "s|^|$file: |"
done | grep -vxFf "$seen_file")

status=0
# Unused names are normal halfway through a change; bun run check still reports them
# shellcheck disable=SC2086
output=$(NO_COLOR=1 bunx oxlint --deny-warnings -A no-unused-vars $files 2>&1 | tail -n 40) || status=2
# Only exit 2 sends stderr to Claude
[ $status = 2 ] && echo "$output" >&2
if [ -n "$comments" ]; then
  echo "$comments" >>"$seen_file"
  printf 'New comments. Keep one only if it gives, in one line, a reason the code cannot show; delete the rest:\n%s\n' "$comments" >&2
  status=2
fi
exit $status
