> ## Documentation Index
> Fetch the complete documentation index at: https://docs.firecrawl.dev/llms.txt
> Use this file to discover all available pages before exploring further.

# List Agent Runs

> Are you an AI agent that needs a Firecrawl API key? See [firecrawl.dev/agent-onboarding/SKILL.md](https://www.firecrawl.dev/agent-onboarding/SKILL.md) for automated onboarding instructions.


## OpenAPI

````yaml api-reference/v2-openapi.json GET /agent
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
  /agent:
    get:
      tags:
        - Agent
      summary: List agent runs
      operationId: listAgents
      parameters:
        - name: before
          in: query
          required: false
          schema:
            type: integer
            minimum: 0
          description: >-
            Only return agent runs created before this unix millisecond
            timestamp. Pages are fixed at 20 runs; use the `before` value from
            the previous page's `next` URL to fetch the next page.
      responses:
        '200':
          description: List of agent runs, most recent first
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  agents:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                          format: uuid
                        createdAt:
                          type: string
                          format: date-time
                        targetHint:
                          type: string
                          description: >-
                            Short hint describing the run's target (first URL or
                            prompt)
                        origin:
                          type: string
                          description: Origin of the run (e.g. "api")
                        integration:
                          type: string
                          description: >-
                            Integration identifier, if the run was started with
                            one
                        settings:
                          type: object
                          properties:
                            hidden:
                              type: boolean
                            starred:
                              type: boolean
                            label:
                              type: string
                        status:
                          type: string
                          enum:
                            - processing
                            - completed
                            - failed
                        options:
                          type: object
                          description: Options the run was started with
                          properties:
                            urls:
                              type: array
                              items:
                                type: string
                                format: uri
                            prompt:
                              type: string
                            schema:
                              type: object
                            model:
                              type: string
                              enum:
                                - spark-2
                                - spark-1-pro
                                - spark-1-mini
                              description: >-
                                Model preset used for the agent run. Every new
                                run executes on spark-2; Spark 1 names only
                                appear on legacy runs.
                            effort:
                              type: string
                              enum:
                                - low
                                - medium
                                - high
                              description: >-
                                Reasoning budget used for the agent run (only
                                present for runs that set effort)
                  next:
                    type: string
                    description: >-
                      Absolute URL of the next page. Only present when more
                      pages exist.
        '400':
          description: Bad request — the before timestamp is invalid.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid before timestamp.
      security:
        - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer

````