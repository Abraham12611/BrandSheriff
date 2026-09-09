> ## Documentation Index
> Fetch the complete documentation index at: https://docs.firecrawl.dev/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Agent Snapshot

While an agent runs, it version-controls its output artifacts — the structured JSON result as it takes shape, plus any markdown, HTML, text, or screenshot artifacts it produces. Every change emits an `artifact.updated` [trace event](/api-reference/endpoint/agent-trace) referencing the new version by `snapshotId`. This endpoint fetches the full content of one such snapshot.

## What it's for

* **Partial results** — preview the agent's structured output before the run finishes. The JSON result artifact (`artifactId: "result"`) is snapshotted as it grows, so each `snapshotId` is a point-in-time view of the final `data`.
* **Rendered artifacts** — fetch the content of non-JSON artifacts the agent produced, such as a markdown report or a screenshot of a page it visited.
* **Run inspection** — pair with the trace to reconstruct exactly how the output evolved over the run.

## How it works

The `artifact.updated` event's `change` field tells you how the snapshot relates to the previous one: `init` (first version), `partial`, `append`, `modify`, or `update`. Each change gets a new `snapshotId` — fetch the latest one for the current state, or walk the history to diff versions.

The `snapshot` field in the response is the artifact content as a string. For `json` artifacts it is JSON-encoded — parse it before use.

<Note>Snapshots are recorded on Spark 2 runs — which is every new run. Jobs started on Spark 1 models before their retirement have no snapshots and return `400`.</Note>

> Are you an AI agent that needs a Firecrawl API key? See [firecrawl.dev/agent-onboarding/SKILL.md](https://www.firecrawl.dev/agent-onboarding/SKILL.md) for automated onboarding instructions.


## OpenAPI

````yaml api-reference/v2-openapi.json GET /agent/{jobId}/snapshots/{snapshotId}
openapi: 3.0.0
info:
  title: Firecrawl API
  version: v2
  description: >-
    API for interacting with Firecrawl services to perform web scraping and
    crawling tasks.
  contact:
    name: Firecrawl Support
    url: https://firecrawl.dev/support
    email: support@firecrawl.dev
servers:
  - url: https://api.firecrawl.dev/v2
security:
  - bearerAuth: []
paths:
  /agent/{jobId}/snapshots/{snapshotId}:
    parameters:
      - name: jobId
        in: path
        description: The ID of the agent job
        required: true
        schema:
          type: string
          format: uuid
      - name: snapshotId
        in: path
        description: The ID of the snapshot, from an artifact.updated trace event
        required: true
        schema:
          type: string
          format: uuid
    get:
      tags:
        - Agent
      summary: Get an output snapshot of an agent job
      operationId: getAgentSnapshot
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  id:
                    type: string
                    format: uuid
                  snapshotId:
                    type: string
                    format: uuid
                  snapshot:
                    type: string
                    description: >-
                      The snapshot content as a JSON-encoded string — the
                      agent's working output artifact at that point in the run.
        '400':
          description: >-
            Bad request — the job ID or snapshot ID is not a valid UUID, or the
            job did not run on spark-2 (snapshots are only available for spark-2
            agent jobs).
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Snapshots are only available for Spark 2 extracts
        '404':
          description: Agent job not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Agent job not found
      security:
        - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer

````