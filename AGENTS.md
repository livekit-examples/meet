# AGENTS.md

This repository already uses markdown-based project guidance.

If you are an automated coding agent working in this codebase, do not treat this
file as the primary source of truth. Use it only as a routing layer.

Read these files first:

1. `CLAUDE.md` for working conventions, commands, environment variables, and
   implementation constraints.
2. `ARCHITECTURE.md` for the system structure, route responsibilities, client/server
   split, and feature behavior.

## Instruction priority

When operating in this repository, follow this order:

1. Explicit user request
2. `CLAUDE.md`
3. `ARCHITECTURE.md`
4. Local code context

## Purpose of this file

This project was originally written with Claude-oriented repository instructions.
`AGENTS.md` exists only to adapt other agents to that setup by redirecting them to
the existing markdown documentation instead of duplicating or replacing it.
