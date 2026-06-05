# GitHub Project Timelines

Use this reference when working with GitHub Project timeline or roadmap views, especially when the user wants a more Gantt-like layout.

Timeline work usually involves three separate concepts:

- Date bars: custom ProjectV2 date fields, often named something like `Phase start` and `Phase target`.
- Row order: the manual ProjectV2 item order, writable with `updateProjectV2ItemPosition`.
- Feature/story nesting: issue parent and sub-issue relationships, writable with `addSubIssue`, `removeSubIssue`, and `reprioritizeSubIssue`.

Changing dates, row positions, parent/sub-issue relationships, or sub-issue priority is a remote write. Only do it when the user explicitly asks for that change.

## Resolution And Access

Resolve the project path first:

- Prefer explicit user input, such as `https://github.com/orgs/OWNER/projects/1`.
- Then use `.agentflow/github.json` when present.
- Otherwise follow [path-resolution.md](path-resolution.md).

Confirm auth before GraphQL writes:

```bash
gh auth status
gh auth refresh -s project
```

Hydrate project and field metadata:

```bash
gh project view PROJECT_NUM --owner OWNER --format json
gh project field-list PROJECT_NUM --owner OWNER --format json
```

Keep these IDs handy:

- `projectId`, such as `PVT_...`
- Project item IDs, such as `PVTI_...`
- Issue node IDs, such as `I_...`
- Date field IDs, such as `PVTF_...`

## Inspect Timeline View Settings

Timeline views are ProjectV2 views whose layout is usually `ROADMAP_LAYOUT`.

```bash
gh api graphql -f query='
query {
  organization(login: "OWNER") {
    projectV2(number: PROJECT_NUM) {
      view(number: VIEW_NUM) {
        id
        number
        name
        layout
        filter
        groupByFields(first: 10) {
          nodes {
            ... on ProjectV2Field { id name dataType }
            ... on ProjectV2SingleSelectField { id name dataType }
            ... on ProjectV2IterationField { id name dataType }
          }
        }
        sortByFields(first: 10) {
          nodes {
            direction
            field {
              ... on ProjectV2Field { id name dataType }
              ... on ProjectV2SingleSelectField { id name dataType }
              ... on ProjectV2IterationField { id name dataType }
            }
          }
        }
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field { id name dataType }
            ... on ProjectV2SingleSelectField { id name dataType }
            ... on ProjectV2IterationField { id name dataType }
          }
        }
      }
    }
  }
}'
```

Public GraphQL currently exposes useful reads for view settings, but do not assume there is a stable public mutation for changing the view definition itself. If the user needs to change the view's sort, group, zoom, or selected date fields, use the UI or browser automation when no documented mutation exists.

## Read Timeline Items

Use GraphQL when you need row order plus issue IDs, parent links, sub-issues, and ProjectV2 field values in one read.

```bash
gh api graphql --paginate -f query='
query($endCursor: String) {
  organization(login: "OWNER") {
    projectV2(number: PROJECT_NUM) {
      items(first: 100, after: $endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content {
            ... on Issue {
              id
              number
              title
              state
              parent { id number title }
              subIssues(first: 50) {
                nodes { id number title state }
              }
            }
          }
          fieldValues(first: 30) {
            nodes {
              ... on ProjectV2ItemFieldDateValue {
                field { ... on ProjectV2Field { name } }
                date
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                field { ... on ProjectV2SingleSelectField { name } }
                name
              }
              ... on ProjectV2ItemFieldTextValue {
                field { ... on ProjectV2Field { name } }
                text
              }
              ... on ProjectV2ItemFieldNumberValue {
                field { ... on ProjectV2Field { name } }
                number
              }
            }
          }
        }
      }
    }
  }
}' --jq '
  .data.organization.projectV2.items.nodes
  | map(select(.content.number != null)
    | {
        itemId: .id,
        issueId: .content.id,
        number: .content.number,
        title: .content.title,
        state: .content.state,
        parent: (.content.parent.number // null),
        fields: (
          .fieldValues.nodes
          | map(
              if has("date") then {key: .field.name, value: .date}
              elif has("name") then {key: .field.name, value: .name}
              elif has("text") then {key: .field.name, value: .text}
              elif has("number") then {key: .field.name, value: .number}
              else empty end
            )
          | from_entries
        )
      }
  )'
```

The returned order is the manual ProjectV2 item order unless the query adds an `orderBy` argument. Use this order when checking what the timeline will render with no explicit sort applied.

## Build A Gantt-Like Order

For a feature/story timeline, a practical order is:

1. Top-level feature issue.
2. Its child issues ordered by target/end date, then start date, then issue number.
3. Repeat for the next feature.
4. Put undated items after dated items inside the same feature, unless the user gives a stronger sequencing rule.

Closed foundational items can stay under their feature if the user wants historical project context visible.

## Update Project Item Row Order

Use `updateProjectV2ItemPosition` to reorder rows. Move each item after the previous item in the desired sequence. For the first item, omit `afterId`.

```bash
PROJECT_ID='PVT_...'

mutation='
mutation($projectId: ID!, $itemId: ID!, $afterId: ID) {
  updateProjectV2ItemPosition(input: {
    projectId: $projectId,
    itemId: $itemId,
    afterId: $afterId
  }) {
    clientMutationId
  }
}'

items=(
  'PVTI_feature_01'
  'PVTI_story_01'
  'PVTI_story_02'
  'PVTI_feature_02'
  'PVTI_story_03'
)

prev=''
for item in "${items[@]}"; do
  if [[ -z "$prev" ]]; then
    gh api graphql -f query="$mutation" -F projectId="$PROJECT_ID" -F itemId="$item" >/dev/null
  else
    gh api graphql -f query="$mutation" -F projectId="$PROJECT_ID" -F itemId="$item" -F afterId="$prev" >/dev/null
  fi
  prev="$item"
done
```

The mutation payload exposes `clientMutationId` and `items`, not a single `item` field.

## Update Feature/Story Nesting

Use issue hierarchy for actual feature/story nesting. Do not fake nesting only by row order when the user wants features and stories connected.

Add or replace a parent:

```bash
gh api graphql -f query='
mutation($featureId: ID!, $storyId: ID!) {
  addSubIssue(input: {
    issueId: $featureId,
    subIssueId: $storyId,
    replaceParent: true
  }) {
    issue { id }
  }
}' -F featureId='I_feature' -F storyId='I_story'
```

Reorder a feature's sub-issues:

```bash
gh api graphql -f query='
mutation($featureId: ID!, $storyId: ID!, $afterId: ID, $beforeId: ID) {
  reprioritizeSubIssue(input: {
    issueId: $featureId,
    subIssueId: $storyId,
    afterId: $afterId,
    beforeId: $beforeId
  }) {
    issue { id }
  }
}' -F featureId='I_feature' -F storyId='I_story' -F afterId='I_previous_story'
```

Use either `afterId` or `beforeId` for a reprioritization step, not both unless you have verified the API accepts that exact combination.

## Update Date Bars

Timeline bars come from date fields. If an item shows as an undated plus/add-to-today row, set the timeline start and target date fields.

```bash
gh api graphql -f query='
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $date: Date!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId,
    itemId: $itemId,
    fieldId: $fieldId,
    value: { date: $date }
  }) {
    projectV2Item { id }
  }
}' \
  -F projectId='PVT_...' \
  -F itemId='PVTI_...' \
  -F fieldId='PVTF_...' \
  -F date='2026-06-05'
```

Clear a date field only when explicitly requested:

```bash
gh api graphql -f query='
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!) {
  clearProjectV2ItemFieldValue(input: {
    projectId: $projectId,
    itemId: $itemId,
    fieldId: $fieldId
  }) {
    projectV2Item { id }
  }
}' -F projectId='PVT_...' -F itemId='PVTI_...' -F fieldId='PVTF_...'
```

## Verify

After writes, read the project back through GraphQL:

```bash
gh api graphql --paginate -f query='
query($endCursor: String) {
  organization(login: "OWNER") {
    projectV2(number: PROJECT_NUM) {
      items(first: 100, after: $endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          content {
            ... on Issue {
              number
              title
              parent { number }
            }
          }
          fieldValues(first: 20) {
            nodes {
              ... on ProjectV2ItemFieldDateValue {
                field { ... on ProjectV2Field { name } }
                date
              }
            }
          }
        }
      }
    }
  }
}' --jq '
  .data.organization.projectV2.items.nodes
  | map(select(.content.number != null)
    | {
        number: .content.number,
        parent: (.content.parent.number // null),
        title: .content.title,
        target: ((.fieldValues.nodes | map(select(.field.name == "Phase target") | .date) | first) // "")
      }
    )
  | .[]
  | "#\(.number) parent=\(.parent) target=\(.target) \(.title)"'
```

Also verify the browser-rendered timeline when the user cares about visual layout. Refresh the timeline view and inspect the first and lower visible rows. GitHub UI caching can lag the API by a few seconds.

## Common Pitfalls

| Symptom | Likely Cause | Fix |
|---|---|---|
| Item row order does not change | The view has an explicit sort applied | Clear or adjust the view sort in the UI, or explain that manual item order is hidden by view sorting |
| Timeline item has no bar | Missing start or target date field | Set the configured date fields |
| Stories appear near features but not nested | Row order was changed but parent/sub-issues were not | Use `addSubIssue` with `replaceParent: true` |
| Sub-issues show in a different order on issue pages | Project item order and sub-issue priority are separate | Use `reprioritizeSubIssue` too |
| Mutation says payload field does not exist | GraphQL return selection is wrong | Introspect the payload type and request only supported fields |
| View settings are readable but not writable | ProjectV2 view mutations are not exposed/stable | Use UI/browser automation for view-level settings |
