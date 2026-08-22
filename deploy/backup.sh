#!/bin/sh
# Nightly database dump, kept KEEP_DAYS days.
#
# Runs as its own container on a sleep loop rather than as a host cron job, so
# the backup travels with the compose file: a server rebuilt from this repo has
# backups running from the first `up`, and there is no step somebody forgets.
#
# It writes to a Docker volume on the same disk as the database, which is half
# a backup: it covers "someone dropped a table" and does not cover "the VPS is
# gone". Pulling the dumps off the box is a step in `docs/DEPLOYMENT.md`, and
# it is not optional.
#
# A dump that has never been restored is not a backup. The runbook has a
# restore drill; do it once before launch and once a quarter after.

set -eu

DIR=/backups
KEEP_DAYS=${KEEP_DAYS:-14}

mkdir -p "$DIR"

while true; do
	STAMP=$(date -u +%Y%m%d-%H%M%S)
	FILE="$DIR/tp-$STAMP.sql.gz"

	echo "backup: dumping to $FILE"

	# --clean --if-exists so the dump can be replayed into a database that
	# already has the schema, which is what a restore actually looks like.
	# Written to a .part first: a half-written file with the final name is a
	# file the retention sweep will happily keep and somebody will trust.
	if pg_dump --clean --if-exists --no-owner --no-privileges \
		| gzip -9 >"$FILE.part"; then
		mv "$FILE.part" "$FILE"
		echo "backup: ok, $(du -h "$FILE" | cut -f1)"
	else
		rm -f "$FILE.part"
		# Loud, and does not exit: one failed night must not stop every night
		# after it. `docker compose logs backup` is where this shows up, and
		# the runbook says to look.
		echo "backup: FAILED at $STAMP" >&2
	fi

	find "$DIR" -name 'tp-*.sql.gz' -type f -mtime "+$KEEP_DAYS" -delete

	# 24 hours. Not cron, because there is no cron daemon in this image and
	# adding one to run a single job is more moving parts than a sleep.
	sleep 86400
done
