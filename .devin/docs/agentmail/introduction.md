> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Introduction

## What is AgentMail?

AgentMail is an API platform for giving AI agents their own inboxes to send, receive, and act upon emails. We handle the infrastructure so you can focus on building email agents.

**Email agents** can:

* Have conversations with users in their inboxes
* Automate email-based workflows for enterprises
* Authenticate with third party applications
* Act as first-class users on the internet

## The Problem with Traditional Email

Existing email infrastructure was built for humans. Legacy providers such as Gmail and Outlook have several limitations for agentic use cases:

#### No API for Inboxes

Legacy providers lack API support for creating new inboxes on-demand.

#### Per-Inbox Pricing

They charge monthly subscriptions per inbox(\$12/inbox/month !!), which is
costly for agents.

#### Restrictive Limits

They impose restrictive rate and sending limits not suitable for automation.

#### Poor DX

Overall, they offer a poor developer experience for building on top of
email. The Gmail API sucks!

## The Solution

AgentMail is an API-first email provider that is designed for agents. Think of it like Gmail, but with:

#### API-First Infrastructure

**Programmatic Inboxes**: Create and manage inboxes via API.

**Usage-Based Pricing**: Pay only for what you use.

**High-Volume Ready**: No restrictive rate or sending limits.

**Real-Time Events**: Get notified instantly with webhooks and websockets.

**Simple Authentication**: Use API keys, no complex OAuth flows.

#### AI-Native Features

**Built-in Security**: Use API permissions and agent guardrails to control
access.

**Full-Text Search**: Search messages and threads across all inboxes in
your organization by sender, subject, or content.

**Automatic Labeling**: Automatically categorize emails with user-defined
prompts.

**Structured Data Extraction**: Pull structured data from unstructured
emails.

And more on the way...

Our customers use AgentMail for agent identity, authentication, and communication. To get started make an account on our [console](https://console.agentmail.to) and please email [support@agentmail.cc](mailto:support@agentmail.cc) if you run into any issues.

## Get Started

#### [Quickstart](/quickstart)

Create your first inbox and send an email in minutes.

#### [Receive emails](/webhooks-overview)

Set up webhooks or WebSockets to receive incoming messages in real time.

#### [API Reference](/api-reference)

## Support

#### [Discord](https://discord.gg/hTYatWYWBc)

#### [Email](mailto:support@agentmail.cc)