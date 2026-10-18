#!/usr/bin/env bash
#
# Start and stop the local website server in the background.
#
#   scripts/server.sh start [dev|prod]   dev (default): next dev with live reload, service worker off
#                                        prod: next build, then next start (service worker on)
#   scripts/server.sh stop               stop the server started by this script
#   scripts/server.sh restart [dev|prod]
#   scripts/server.sh status
#   scripts/server.sh logs               follow the server output
#
# Port: $PORT if set, otherwise 3000; if that port is taken by another program,
# the next free port is used. The PID, mode, port and log live in .server/ (git-ignored).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE="$ROOT/.server"
PID_FILE="$STATE/pid"
PORT_FILE="$STATE/port"
MODE_FILE="$STATE/mode"
LOG_FILE="$STATE/server.log"

cd "$ROOT"

port_in_use() {
	lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

free_port() {
	local port="$1"
	while port_in_use "$port"; do
		port=$((port + 1))
	done
	echo "$port"
}

running_pid() {
	[ -f "$PID_FILE" ] || return 1
	local pid
	pid="$(cat "$PID_FILE")"
	kill -0 "$pid" 2>/dev/null || return 1
	echo "$pid"
}

# Kill a process and everything it started (next spawns worker processes)
kill_tree() {
	local pid="$1" child
	for child in $(pgrep -P "$pid" 2>/dev/null); do
		kill_tree "$child"
	done
	kill "$pid" 2>/dev/null || true
}

start() {
	local mode="${1:-dev}"
	if [ "$mode" != "dev" ] && [ "$mode" != "prod" ]; then
		echo "Unknown mode '$mode' (use dev or prod)" >&2
		exit 1
	fi

	if pid="$(running_pid)"; then
		echo "Already running ($(cat "$MODE_FILE"), PID $pid): http://localhost:$(cat "$PORT_FILE")"
		exit 0
	fi

	[ -d node_modules ] || npm install

	local wanted="${PORT:-3000}" port
	port="$(free_port "$wanted")"
	if [ "$port" != "$wanted" ]; then
		echo "Port $wanted is taken by another program, using $port"
	fi

	mkdir -p "$STATE"

	if [ "$mode" = "prod" ]; then
		echo "Building..."
		npm run build >"$LOG_FILE" 2>&1 || {
			echo "Build failed, see $LOG_FILE" >&2
			tail -20 "$LOG_FILE" >&2
			exit 1
		}
		nohup npx next start -p "$port" >>"$LOG_FILE" 2>&1 &
	else
		nohup npx next dev -p "$port" >"$LOG_FILE" 2>&1 &
	fi

	echo $! >"$PID_FILE"
	echo "$port" >"$PORT_FILE"
	echo "$mode" >"$MODE_FILE"

	# Wait until the server answers (up to 60s)
	local i
	for i in $(seq 1 60); do
		if curl -s -o /dev/null "http://localhost:$port/"; then
			echo "Started ($mode, PID $(cat "$PID_FILE")): http://localhost:$port"
			return 0
		fi
		if ! running_pid >/dev/null; then
			echo "Server exited during startup, see $LOG_FILE" >&2
			tail -20 "$LOG_FILE" >&2
			rm -f "$PID_FILE"
			exit 1
		fi
		sleep 1
	done
	echo "Server is still starting; check $LOG_FILE (http://localhost:$port)"
}

stop() {
	local pid
	if ! pid="$(running_pid)"; then
		echo "Not running"
		rm -f "$PID_FILE"
		return 0
	fi

	kill_tree "$pid"
	local i
	for i in $(seq 1 10); do
		kill -0 "$pid" 2>/dev/null || break
		sleep 0.5
	done
	kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true

	rm -f "$PID_FILE"
	echo "Stopped (port $(cat "$PORT_FILE" 2>/dev/null || echo '?') is free)"
}

status() {
	local pid
	if pid="$(running_pid)"; then
		echo "Running ($(cat "$MODE_FILE"), PID $pid): http://localhost:$(cat "$PORT_FILE")"
	else
		echo "Not running"
	fi
}

case "${1:-}" in
	start) start "${2:-dev}" ;;
	stop) stop ;;
	restart) stop; start "${2:-dev}" ;;
	status) status ;;
	logs) [ -f "$LOG_FILE" ] && tail -f "$LOG_FILE" || echo "No log yet" ;;
	*)
		echo "Usage: scripts/server.sh {start [dev|prod]|stop|restart [dev|prod]|status|logs}" >&2
		exit 1
		;;
esac
