> ## Documentation Index
> Fetch the complete documentation index at: https://docs.firecrawl.dev/llms.txt
> Use this file to discover all available pages before exploring further.

# For Humans

> Sign in via your browser.

## Sign in

OAuth server URL (Streamable HTTP; the client starts browser sign-in): `https://mcp.firecrawl.dev/v2/mcp-oauth`

* Codex: `codex mcp add firecrawl --url https://mcp.firecrawl.dev/v2/mcp-oauth` then `codex mcp login firecrawl`
* Claude Code: `claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp-oauth` then complete sign-in via `/mcp`
* Cursor or any JSON-config client: `{"mcpServers": {"firecrawl": {"url": "https://mcp.firecrawl.dev/v2/mcp-oauth"}}}`
* OpenCode (`opencode.json`): `{"mcp": {"firecrawl": {"type": "remote", "url": "https://mcp.firecrawl.dev/v2/mcp-oauth", "enabled": true}}}`
* ChatGPT or Claude.ai: use the native Firecrawl connector — [ChatGPT](https://chatgpt.com/plugins?q=firecrawl) or [Claude](https://claude.ai/directory/connectors/firecrawl).

A human must complete the browser sign-in and approve a team. Do not open the server URL directly in a browser.

<Note>
  `https://mcp.firecrawl.dev/v2/mcp-oauth` is a server URL for your MCP client. It is not a page to open directly in a browser. Your client starts the browser sign-in flow.
</Note>

You can review and revoke connections from [MCP settings](https://www.firecrawl.dev/app/settings?tab=mcp).

## ChatGPT and Claude

<CardGroup cols={2}>
  <Card title="Add to ChatGPT" icon="https://mintcdn.com/firecrawl/CCJGFNIrBeZmk4E5/images/agent-clients/chatgpt.svg?fit=max&auto=format&n=CCJGFNIrBeZmk4E5&q=85&s=f1da3550e42a8fb856053fbe6d8a083a" href="https://chatgpt.com/plugins?q=firecrawl" cta="Open in ChatGPT" arrow width="24" height="24" data-path="images/agent-clients/chatgpt.svg">
    Install the native Firecrawl connector in ChatGPT.
  </Card>

  <Card title="Add to Claude" icon="https://mintcdn.com/firecrawl/CCJGFNIrBeZmk4E5/images/agent-clients/claude-ai.svg?fit=max&auto=format&n=CCJGFNIrBeZmk4E5&q=85&s=01e23ce8cedaa21257700fb093ed3735" href="https://claude.ai/directory/connectors/firecrawl" cta="Open in Claude" arrow width="24" height="24" data-path="images/agent-clients/claude-ai.svg">
    Install the native Firecrawl connector in Claude.
  </Card>
</CardGroup>

## Add an API key

<Card title="Add an API key" icon="key" href="/mcp-server/keyless#add-an-api-key" arrow>
  Prefer a key in your client config instead of browser sign-in. Setup lives on For Agents.
</Card>

## Try

```text theme={null}
Search the web for the latest Firecrawl release notes and summarize the sources.
```

If no Firecrawl tools appear, restart or reload the client after saving its MCP configuration.

## More

<CardGroup cols={2}>
  <Card title="Choose a tool" icon="wrench" href="/mcp-server/tools">
    Find the right Firecrawl MCP tool and review connection-specific availability.
  </Card>

  <Card title="Run locally" icon="terminal" href="/mcp-server/local">
    Start the open-source server over stdio or Streamable HTTP.
  </Card>
</CardGroup>
