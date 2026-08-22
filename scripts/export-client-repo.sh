#!/usr/bin/env bash
#
# Builds a clean copy of this repo, at HEAD, with everything marked
# `export-ignore` in .gitattributes left out — the AI context pack, the
# handoff notes, the session-planning docs. Nothing about the working repo
# changes: no history is rewritten, nothing here is untracked, this only
# reads what `git archive` would export.
#
# By default it stops after building the export locally, so a human looks
# at it before anything reaches a remote. Pushing needs the target repo
# named explicitly and the --push flag; there is no default remote, on
# purpose, since the whole point is this repo and the client's are not the
# same thing and must never be confused.
#
# Usage:
#   scripts/export-client-repo.sh                          build only, print where
#   scripts/export-client-repo.sh --push <git-url> [branch] build, then push (asks first)

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Untracked files do not matter here — `git archive HEAD` only ever exports
# the committed tree, so a stray file sitting in the working directory has no
# effect on it. What would matter is an uncommitted change to a *tracked*
# file, which the archive would silently miss.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "error: tracked files have uncommitted changes." >&2
  echo "  Commit or stash first — the export is built from HEAD, and an" >&2
  echo "  uncommitted change would silently be left out of it." >&2
  exit 1
fi

COMMIT=$(git rev-parse --short HEAD)
OUT_DIR="${EXPORT_DIR:-.export-client-repo}"

echo "Building a clean export of $COMMIT into $OUT_DIR/ ..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
git archive HEAD | tar -x -C "$OUT_DIR"

echo "Excluded (per .gitattributes export-ignore):"
git ls-tree -r --name-only HEAD | while read -r path; do
  [ -e "$OUT_DIR/$path" ] || echo "  - $path"
done

(
  cd "$OUT_DIR"
  git init -q
  git add -A
  git commit -q -m "Deploy snapshot from $COMMIT

Built by scripts/export-client-repo.sh. This repo has no history before
this commit by design: it is a clean export, not a mirror. The working
repo with full history stays where it is."
)

echo
echo "Export ready at $OUT_DIR/, one commit, clean tree."

if [ "${1:-}" = "--push" ]; then
  REMOTE="${2:?usage: $0 --push <git-url> [branch]}"
  BRANCH="${3:-main}"

  echo
  echo "About to force-push this snapshot to:"
  echo "  $REMOTE ($BRANCH)"
  echo "This replaces whatever is on that branch right now. It is the client's"
  echo "production repo — confirm this is really where it should go."
  read -r -p "Type the word 'push' to continue: " CONFIRM
  if [ "$CONFIRM" != "push" ]; then
    echo "Not pushed. The export is still sitting in $OUT_DIR/ if you want it."
    exit 1
  fi

  (
    cd "$OUT_DIR"
    git branch -M "$BRANCH"
    git remote add client "$REMOTE"
    git push --force client "$BRANCH"
  )
  echo "Pushed to $REMOTE ($BRANCH)."
else
  echo "Not pushed. To push:"
  echo "  scripts/export-client-repo.sh --push <git-url> [branch]"
fi
