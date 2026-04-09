# Column: Approved

**Actor:** Agent (Ralph Loop)
**Agent:** None
**Commit:** None

---

## Summary

Holding area for human-approved cards ready for agent work. Cards enter this column when a human moves them from `new`, signaling they are ready to be processed.

The Ralph Loop picks up cards from this column, creates a feature branch, and moves them to Refinement.

---

## Definition of Done

- Dependencies checked (if any)
- Feature branch created and checked out (from main or predecessor)
- Branch name recorded in card context
- Card moved to `refinement` column

---

## What Happens

### Agent Pickup

The next Ralph Loop iteration:
1. Picks up the card from `approved`
2. Checks for dependencies (predecessors)
3. Creates feature branch (from main or predecessor's branch)
4. Records branch name in card context
5. Moves card to `refinement`
6. Continues with refinement phase

### Dependency Handling

If the card has dependencies (`## Dependencies` section):
- **All predecessors in `done`:** Branch from main as usual
- **Some predecessors incomplete:** Agent uses judgment:
  - May wait (exit without starting) if predecessor is close
  - May proceed (branch from predecessor) if urgent or human approved
  - Documents decision in Conversation Log

---

## Branch Creation

When picking up a card from `approved`, create a dedicated branch.

### Step 1: Check for Existing Branch

First, check if the card already has a branch (returning from rejection):

```
Look for "## Branch" section in card context
```

**If branch exists:** Just checkout the existing branch:
```bash
git checkout {existing-branch-name}
```
Then skip to "Record Branch" step.

**If no branch:** Continue to create one.

### Step 2: Generate Branch Name

```bash
# Format: {type}/{id}-{slug}
# Example: feature/123-add-user-authentication

TYPE={card.type}  # feature, bug, or refactor
ID={card.id}      # Issue number or card ID
SLUG=$(echo "{card.title}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)

BRANCH="${TYPE}/${ID}-${SLUG}"
```

### Step 3: Check for Dependencies

Before creating the branch, check if this card has predecessors:

```
Look for "## Dependencies" section in card context
Parse "Blocked by:" line for predecessor IDs
```

**For each predecessor:**
1. Check predecessor's column (use `/af show {predecessor-id}`)
2. Determine if predecessor is complete

| Predecessor State | Action |
|-------------------|--------|
| `done` | Predecessor is in main — branch from main |
| `final-review` | Almost done — agent decides: wait or branch from predecessor |
| Earlier columns | In progress — agent decides: wait or branch from predecessor |

**Decision guidance:**
- If ALL predecessors are in `done` → proceed normally, branch from main
- If predecessor is in `final-review` and task is urgent → may branch from predecessor
- If predecessor is in earlier columns → prefer waiting, but can proceed if human approves

### Step 4: Create and Checkout Branch

**If branching from main** (no unfinished predecessors):
```bash
# Ensure we're on main and up to date
git checkout main
git pull --rebase origin main

# Create and switch to new branch
git checkout -b "$BRANCH"
```

**If branching from predecessor** (starting with unfinished predecessor):
```bash
# Get predecessor's branch from their card context
PREDECESSOR_BRANCH={from predecessor's ## Branch section}

# Fetch and checkout predecessor's branch
git fetch origin
git checkout "$PREDECESSOR_BRANCH"
git pull --rebase origin "$PREDECESSOR_BRANCH"

# Create new branch from predecessor
git checkout -b "$BRANCH"
```

**Document the decision** in Conversation Log:
```
/af context {id} append "
## Conversation Log

**[Agent - {date}]:** Starting with predecessor #{predecessor-id} not yet in main.
- Predecessor status: {column}
- Decision: Branching from \`{predecessor-branch}\` instead of main
- Rationale: {why proceeding now vs waiting}

Note: Will need to rebase if predecessor gets updates before this lands.
"
```

### Step 5: Record Branch in Card Context

Get the GitHub repo URL to create a branch link:
```bash
# Extract owner/repo from git remote
REMOTE=$(git remote get-url origin)
# Handle both HTTPS and SSH formats
REPO_URL=$(echo "$REMOTE" | sed -E 's#git@github.com:#https://github.com/#' | sed 's/\.git$//')
BRANCH_URL="${REPO_URL}/tree/${BRANCH}"
```

Add to card context using `/af context` with a clickable link:
```
/af context {id} append "
## Branch
[{branch-name}]({branch-url})
"
```

**Example:**
```markdown
## Branch
[bug/123-fix-login-flow](https://github.com/owner/repo/tree/bug/123-fix-login-flow)
```

**If branched from predecessor, also note:**
```
/af context {id} append "
Branched from: [{predecessor-branch}]({predecessor-branch-url}) (predecessor not yet in main)
"
```

---

## Entry Criteria

- Card exists in `new` column
- Human has reviewed the card
- Human moved card to `approved`

---

## Exit Criteria

- Feature branch created (or existing branch checked out)
- Branch name recorded in card context
- Card moved to `refinement` by Ralph Loop

---

## Next Column

> **Refinement** (picked up by Ralph Loop)
