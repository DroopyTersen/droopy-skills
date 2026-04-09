#!/bin/bash
#
# AgentFlow Ralph Loop
# Runs Claude or Codex repeatedly until no workable cards remain.
#
# Usage:
#   .agentflow/loop.sh              # Default: Claude, 20 iterations
#   .agentflow/loop.sh 50           # Claude, 50 iterations
#   .agentflow/loop.sh --codex      # Codex, 20 iterations
#   .agentflow/loop.sh --codex 50   # Codex, 50 iterations
#   .agentflow/loop.sh --claude 50  # Claude, 50 iterations (explicit)
#
# Requirements:
#   - Claude Code CLI or Codex CLI installed
#   - Backend config: .agentflow/board.json (local), .agentflow/github.json (GitHub), or .agentflow/azure-devops.json (Azure DevOps)
#   - .agentflow/RALPH_LOOP_PROMPT.md exists
#
# Output:
#   - .agentflow/iterations/        # Per-iteration output files
#   - .agentflow/loop_status.txt    # Current status summary (always small)
#

set -e

# Parse arguments
CLI_TYPE="claude"
MAX_ITERATIONS=20

while [[ $# -gt 0 ]]; do
    case $1 in
        --codex)
            CLI_TYPE="codex"
            shift
            ;;
        --claude)
            CLI_TYPE="claude"
            shift
            ;;
        *)
            # Assume it's the max iterations number
            if [[ $1 =~ ^[0-9]+$ ]]; then
                MAX_ITERATIONS=$1
            fi
            shift
            ;;
    esac
done
KEEP_ITERATIONS=5
PROMPT_FILE=".agentflow/RALPH_LOOP_PROMPT.md"
ITERATIONS_DIR=".agentflow/iterations"
STATUS_FILE=".agentflow/loop_status.txt"
START_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# Verify setup - supports local (board.json), GitHub (github.json), and Azure DevOps (azure-devops.json) backends
[[ -f ".agentflow/board.json" || -f ".agentflow/github.json" || -f ".agentflow/azure-devops.json" ]] || { echo "Error: No backend found (.agentflow/board.json, .agentflow/github.json, or .agentflow/azure-devops.json)"; exit 1; }
[[ -f "$PROMPT_FILE" ]] || { echo "Error: $PROMPT_FILE not found"; exit 1; }

# Verify CLI is available
if [[ "$CLI_TYPE" == "codex" ]]; then
    command -v codex >/dev/null 2>&1 || { echo "Error: Codex CLI not found. Install with: npm install -g @openai/codex"; exit 1; }
else
    command -v claude >/dev/null 2>&1 || { echo "Error: Claude Code CLI not found"; exit 1; }
fi

# Create iterations directory
mkdir -p "$ITERATIONS_DIR"

# Keep-alive: prevent Sprite hibernation by generating HTTP activity
# (harmless on non-Sprite systems)
python3 -m http.server 8080 --directory /tmp > /dev/null 2>&1 &
KEEPALIVE_HTTP=$!
(while true; do sleep 20; curl -s http://localhost:8080 > /dev/null; done) &
KEEPALIVE_PING=$!
trap "kill $KEEPALIVE_HTTP $KEEPALIVE_PING 2>/dev/null" EXIT

# Initialize status file
cat > "$STATUS_FILE" << EOF
AgentFlow Loop Status
=====================
Started: $START_TIME
CLI: $CLI_TYPE
Max iterations: $MAX_ITERATIONS
Status: running
Current: 0/$MAX_ITERATIONS
EOF

echo "AgentFlow Loop | CLI: $CLI_TYPE | Max: $MAX_ITERATIONS iterations | Ctrl+C to stop"
echo "Status: $STATUS_FILE"
echo "Iterations: $ITERATIONS_DIR/"
echo ""

cleanup_old_iterations() {
    # Keep only the last N iteration files
    local count=$(ls -1 "$ITERATIONS_DIR"/iteration_*.txt 2>/dev/null | wc -l)
    if [[ $count -gt $KEEP_ITERATIONS ]]; then
        ls -1t "$ITERATIONS_DIR"/iteration_*.txt | tail -n +$((KEEP_ITERATIONS + 1)) | xargs rm -f
    fi
}

update_status() {
    local iteration=$1
    local status=$2
    local detail=$3
    cat > "$STATUS_FILE" << EOF
AgentFlow Loop Status
=====================
Started: $START_TIME
Max iterations: $MAX_ITERATIONS
Status: $status
Current: $iteration/$MAX_ITERATIONS
Last update: $(date '+%H:%M:%S')

$detail

Recent iterations: $ITERATIONS_DIR/
EOF
}

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    ITERATION_FILE="$ITERATIONS_DIR/iteration_$(printf '%03d' $i).txt"

    echo "--- Iteration $i/$MAX_ITERATIONS ---"
    update_status "$i" "running" "Processing iteration $i..."

    # Run CLI in background, show progress dots every 10 seconds
    set +e
    if [[ "$CLI_TYPE" == "codex" ]]; then
        # Codex exec mode (--yolo = full auto + no sandbox)
        codex exec "$(cat $PROMPT_FILE)" \
            --yolo \
            --json \
            > "$ITERATION_FILE" 2>&1 &
    else
        # Claude Code mode
        claude -p "$(cat $PROMPT_FILE)" \
            --verbose \
            --dangerously-skip-permissions \
            --output-format stream-json \
            --chrome \
            > "$ITERATION_FILE" 2>&1 &
    fi
    CLI_PID=$!

    # Show dots while waiting (flush immediately)
    while kill -0 $CLI_PID 2>/dev/null; do
        sleep 10
        echo -n "." >&2
    done
    wait $CLI_PID
    EXIT_CODE=$?
    set -e

    echo "" >&2  # newline after dots
    echo "[$(date '+%H:%M:%S')] Iteration $i complete (exit: $EXIT_CODE, cli: $CLI_TYPE)"

    # Show what was added to progress.txt (last entry)
    if [[ -f ".agentflow/progress.txt" ]]; then
        echo "--- Progress ---"
        # Show from last "---" separator to end (tail -r is macOS version of tac)
        tail -r .agentflow/progress.txt 2>/dev/null | sed '/^---$/q' | tail -r 2>/dev/null || \
        tac .agentflow/progress.txt 2>/dev/null | sed '/^---$/q' | tac 2>/dev/null || \
        tail -20 .agentflow/progress.txt
        echo "----------------"
    fi

    # Check for errors
    if [[ $EXIT_CODE -ne 0 ]]; then
        echo "Warning: $CLI_TYPE exited with code $EXIT_CODE"
        update_status "$i" "error" "Iteration $i failed with exit code $EXIT_CODE"
    fi

    # Check for completion signals
    # Signal detection varies by CLI type:
    # - Claude: "result" field in stream-json output
    # - Codex: JSON Lines with "message" or "content" fields
    if [[ "$CLI_TYPE" == "codex" ]]; then
        # Codex JSON Lines format - check for signal in agent_message text field only
        # IMPORTANT: Must match "type":"agent_message" to avoid false positives from
        # documentation text in command output (aggregated_output field)
        if grep -qE '"type":"agent_message".*"text":"[^"]*AGENTFLOW_NO_WORKABLE_CARDS' "$ITERATION_FILE" 2>/dev/null; then
            echo ""
            echo "No workable cards remain."
            update_status "$i" "complete" "No workable cards remain. Loop finished after $i iteration(s)."
            cleanup_old_iterations
            echo "Loop finished after $i iteration(s)"
            exit 0
        fi

        if grep -qE '"type":"agent_message".*"text":"[^"]*AGENTFLOW_ITERATION_COMPLETE' "$ITERATION_FILE" 2>/dev/null; then
            echo "Card processed successfully."
        else
            echo "Warning: No completion signal found. Agent may have been interrupted."
            update_status "$i" "warning" "Iteration $i: No completion signal. Continuing anyway..."
        fi
    else
        # Claude stream-json format - check "result" field
        if grep -q '"result":"[^"]*AGENTFLOW_NO_WORKABLE_CARDS' "$ITERATION_FILE" 2>/dev/null; then
            echo ""
            echo "No workable cards remain."
            update_status "$i" "complete" "No workable cards remain. Loop finished after $i iteration(s)."
            cleanup_old_iterations
            echo "Loop finished after $i iteration(s)"
            exit 0
        fi

        if grep -q '"result":"[^"]*AGENTFLOW_ITERATION_COMPLETE' "$ITERATION_FILE" 2>/dev/null; then
            echo "Card processed successfully."
        else
            echo "Warning: No completion signal found. Agent may have been interrupted."
            update_status "$i" "warning" "Iteration $i: No completion signal. Continuing anyway..."
        fi
    fi

    # Cleanup old iterations to save disk space
    cleanup_old_iterations

    # Update status with last iteration summary
    LAST_LINES=$(tail -10 "$ITERATION_FILE" | head -5)
    update_status "$i" "running" "Last iteration summary:\n$LAST_LINES"

    echo ""
    sleep 2
done

update_status "$MAX_ITERATIONS" "complete" "Max iterations reached."
cleanup_old_iterations
echo "Loop finished after $MAX_ITERATIONS iteration(s) (max reached)"
