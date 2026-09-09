> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# WebSockets Quickstart

## Copy for Cursor / Claude

Copy one of the blocks below into Cursor or Claude for instant WebSocket setup.

```python title="Python"
"""
AgentMail WebSockets Quickstart — copy into Cursor/Claude.
client.websockets.connect() → socket.send_subscribe(Subscribe(inbox_ids=[...])) → iterate socket for events.
"""
from agentmail import AgentMail, Subscribe, Subscribed, MessageReceivedEvent

client = AgentMail()
with client.websockets.connect() as socket:
  socket.send_subscribe(Subscribe(inbox_ids=["my-agent@agentmail.to"]))
  for event in socket:
    if isinstance(event, Subscribed): print(f"Subscribed to {event.inbox_ids}")
    elif isinstance(event, MessageReceivedEvent): print(f"Received from: {event.message.from_}")
```

```typescript title="TypeScript"
/**
 * AgentMail WebSockets Quickstart — copy into Cursor/Claude.
 * client.websockets.connect() → sendSubscribe({ type: "subscribe", inboxIds }) → on("message", ...)
 */
import { AgentMailClient } from "agentmail";

const client = new AgentMailClient();
const socket = await client.websockets.connect();
socket.on("message", async (e) => {
  if (e.type === "subscribed") console.log("Subscribed to", e.inboxIds);
  else if (e.type === "event" && e.eventType === "message.received") console.log("Received from:", e.message?.from);
});
await socket.waitForOpen();
socket.sendSubscribe({ type: "subscribe", inboxIds: ["my-agent@agentmail.to"] });
```

## SDK Examples

```typescript title="TypeScript"
import { AgentMailClient } from "agentmail";

const client = new AgentMailClient();

async function main() {
  const socket = await client.websockets.connect();

  socket.on("message", async (event) => {
    if (event.type === "subscribed") {
      console.log("Subscribed to", event.inboxIds);
    } else if (
      event.type === "event" &&
      event.eventType === "message.received"
    ) {
      console.log(`Received message from: ${event.message.from}`);
    }
  });

  await socket.waitForOpen();

  socket.sendSubscribe({
    type: "subscribe",
    inboxIds: ["my-agent@agentmail.to"],
  });
}

main();
```

```python title="Python"
from agentmail import AgentMail, MessageReceivedEvent, Subscribe, Subscribed

client = AgentMail()

with client.websockets.connect() as socket:
    socket.send_subscribe(Subscribe(inbox_ids=["my-agent@agentmail.to"]))

    for event in socket:
        if isinstance(event, Subscribed):
            print(f"Subscribed to {event.inbox_ids}")
        elif isinstance(event, MessageReceivedEvent):
            msg = event.message
            print(f"Received message from: {msg.from_}")
```