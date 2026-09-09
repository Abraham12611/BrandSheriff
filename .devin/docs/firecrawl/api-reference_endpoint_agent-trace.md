> ## Documentation Index
> Fetch the complete documentation index at: https://docs.firecrawl.dev/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Agent Trace

Every agent run records a canonical **execution trace**: an ordered stream of events describing everything the run did — which tools it called and what they returned, reasoning summaries, progress updates, browser sessions, and changes to its output artifacts. This is the same event stream that powers the live Activity view in the [Agent playground](https://www.firecrawl.dev/app/agent).

## What it's for

* **Debugging runs** — see the exact searches, scrapes, and extractions the agent performed, each tool's input (`tool_call.started`) and result (`tool_call.finished`), and where a run went wrong (`error.occurred`, and the terminal `run.finished` event's `outcome` and structured `error`).
* **Live progress UIs** — poll the trace while a job is `processing` to show what the agent is doing in real time. `progress.reported` events carry the run's phase (`planning`, `working`, `finalizing`) with a human-readable message, and `reasoning.summary` events narrate the agent's thinking.
* **Live browser view** — pass `?liveView=true` while a run is in flight to get `activeBrowserSessions`: the run's active browser sessions, each with a `liveViewUrl` you can embed to watch (or demo) the agent browsing.
* **Cost tracking** — `creditsUsed` reports credits consumed so far, capped at the run's `maxCredits` if one was set.

## How it works

Events are emitted by the run's agents — the `orchestrator` and its `subagent`s — and each event identifies its emitter in the `agent` field. Browser work happens inside an agent's own browser session and is reported through `browser.session.*` events, not by separate browser agents. Order events by `producerSequence` (per emitting agent). The `type` field discriminates the 13 event variants; see the response schema below for the full list and each variant's fields.

`artifact.updated` events don't carry the artifact content itself — they reference it by `snapshotId`, which you fetch with the [snapshot endpoint](/api-reference/endpoint/agent-snapshot).

Events can continue to land for a moment after `run.finished` arrives, so if you're polling a live run, keep a short tail window open before rendering the final state.

<Note>Traces are recorded on Spark 2 runs — which is every new run. Jobs started on Spark 1 models before their retirement have no trace and return `400`.</Note>

> Are you an AI agent that needs a Firecrawl API key? See [firecrawl.dev/agent-onboarding/SKILL.md](https://www.firecrawl.dev/agent-onboarding/SKILL.md) for automated onboarding instructions.


## OpenAPI

````yaml api-reference/v2-openapi.json GET /agent/{jobId}/trace
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
  /agent/{jobId}/trace:
    parameters:
      - name: jobId
        in: path
        description: The ID of the agent job
        required: true
        schema:
          type: string
          format: uuid
    get:
      tags:
        - Agent
      summary: Get the execution trace of an agent job
      operationId: getAgentTrace
      parameters:
        - name: liveView
          in: query
          description: >-
            If "true", include the currently active browser sessions with live
            view URLs.
          required: false
          schema:
            type: string
            enum:
              - 'true'
              - 'false'
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
                  events:
                    type: array
                    description: >-
                      Canonical execution events for the run; group by agent.id,
                      then order each group by producerSequence, which is
                      monotonic per emitting agent. artifact.updated events
                      carry the snapshotId values used by the snapshots
                      endpoint.
                    items:
                      $ref: '#/components/schemas/AgentTraceEvent'
                  creditsUsed:
                    type: number
                    description: >-
                      Credits consumed so far, capped at maxCredits if one was
                      set.
                  activeBrowserSessions:
                    type: array
                    description: >-
                      Currently active browser sessions (only present when
                      liveView=true).
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        liveViewUrl:
                          type: string
                        viewport:
                          type: object
                          properties:
                            width:
                              type: number
                            height:
                              type: number
        '400':
          description: >-
            Bad request — the job ID is not a valid UUID, or the job did not run
            on spark-2 (traces are only available for spark-2 agent jobs).
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Trace is only available for Spark 2 extracts
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
  schemas:
    AgentTraceEvent:
      description: >-
        A canonical execution event from an agent run. Every event carries the
        envelope fields schemaVersion, eventId, runId, occurredAt,
        producerSequence and agent; the type field discriminates the variant.
        usage.recorded events are internal and never exposed, and agent.started
        events omit the model field.
      oneOf:
        - title: run.started
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - run.started
              description: Emitted when the run starts.
        - title: run.cancel_requested
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - reason
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - run.cancel_requested
              description: >-
                Emitted when cancellation is requested (via DELETE
                /agent/{jobId}).
            reason:
              type: string
              enum:
                - user
        - title: run.finished
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - outcome
            - error
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - run.finished
              description: Terminal event for the run.
            outcome:
              type: string
              enum:
                - succeeded
                - failed
                - cancelled
                - refused
                - credit_limit_reached
            error:
              nullable: true
              allOf:
                - $ref: '#/components/schemas/AgentTraceError'
              description: Null when outcome is succeeded; otherwise the structured error.
        - title: agent.started
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - agent.started
              description: Emitted when an agent (orchestrator or subagent) starts.
        - title: agent.finished
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - outcome
            - durationMs
            - error
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - agent.finished
              description: Emitted when an agent finishes.
            outcome:
              type: string
              enum:
                - succeeded
                - failed
                - cancelled
                - refused
            durationMs:
              type: integer
            error:
              nullable: true
              allOf:
                - $ref: '#/components/schemas/AgentTraceError'
              description: Null when outcome is succeeded; otherwise the structured error.
        - title: browser.session.started
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - sessionId
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - browser.session.started
              description: Emitted when a browser session starts.
            sessionId:
              type: string
        - title: browser.session.finished
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - sessionId
            - durationMs
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - browser.session.finished
              description: Emitted when a browser session finishes.
            sessionId:
              type: string
            durationMs:
              type: integer
        - title: progress.reported
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - phase
            - message
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - progress.reported
              description: Emitted when the orchestrator reports progress.
            phase:
              type: string
              enum:
                - planning
                - working
                - finalizing
            message:
              type: string
        - title: reasoning.summary
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - text
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - reasoning.summary
              description: A summary of the agent's reasoning.
            text:
              type: string
        - title: tool_call.started
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - toolCallId
            - toolName
            - parameters
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - tool_call.started
              description: Emitted when a tool call starts.
            toolCallId:
              type: string
            toolName:
              type: string
            parameters:
              description: The input passed to the tool (arbitrary JSON).
        - title: tool_call.finished
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - toolCallId
            - toolName
            - result
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - tool_call.finished
              description: Emitted when a tool call finishes.
            toolCallId:
              type: string
            toolName:
              type: string
            result:
              description: The result returned by the tool (arbitrary JSON).
        - title: artifact.updated
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - artifact
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - artifact.updated
              description: Emitted when an output artifact changes.
            artifact:
              $ref: '#/components/schemas/AgentTraceArtifact'
        - title: error.occurred
          type: object
          required:
            - schemaVersion
            - eventId
            - runId
            - occurredAt
            - producerSequence
            - agent
            - type
            - error
          properties:
            schemaVersion:
              type: integer
              enum:
                - 1
            eventId:
              type: string
              format: uuid
              description: Unique ID of this event.
            runId:
              type: string
              format: uuid
              description: The agent job ID this event belongs to.
            occurredAt:
              type: string
              format: date-time
            producerSequence:
              type: integer
              description: >-
                Monotonic sequence number from the emitting agent; order events
                by it.
            agent:
              $ref: '#/components/schemas/AgentTraceAgent'
            type:
              type: string
              enum:
                - error.occurred
              description: Emitted when a non-fatal error occurs during the run.
            error:
              $ref: '#/components/schemas/AgentTraceError'
      discriminator:
        propertyName: type
    AgentTraceAgent:
      type: object
      description: Identity of the agent that emitted the event.
      required:
        - id
        - role
        - name
      properties:
        id:
          type: string
          format: uuid
        role:
          type: string
          enum:
            - orchestrator
            - subagent
            - system
        name:
          type: string
        parentId:
          type: string
          format: uuid
          description: ID of the parent agent (present on subagents).
    AgentTraceError:
      type: object
      description: Structured error attached to terminal and error events.
      required:
        - code
        - source
        - retryable
        - message
      properties:
        code:
          type: string
          enum:
            - cancelled
            - credit_limit_reached
            - parent_finished
            - refused
            - internal
        source:
          type: string
          enum:
            - agent
            - tool
            - billing
            - system
        retryable:
          type: boolean
        message:
          type: string
    AgentTraceArtifact:
      type: object
      description: Descriptor for a change to an output artifact.
      required:
        - kind
        - artifactId
        - snapshotId
        - change
      properties:
        kind:
          type: string
          enum:
            - json
            - markdown
            - html
            - screenshot
            - text
        artifactId:
          type: string
        path:
          type: string
          description: Workspace path of the artifact, e.g. /workspace/data.json.
        snapshotId:
          type: string
          format: uuid
          description: >-
            Pass to GET /agent/{jobId}/snapshots/{snapshotId} to fetch this
            snapshot's content.
        change:
          type: string
          enum:
            - init
            - partial
            - append
            - modify
            - update
        changedFields:
          type: array
          items:
            type: string
        itemCount:
          type: integer
        sourceToolCallId:
          type: string
          description: The tool call that produced this change, when applicable.
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer

````