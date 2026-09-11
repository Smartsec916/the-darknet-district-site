---
name: Workflow control disconnects
description: How to interpret managed workflow restart failures that occur before the application process starts.
---

If a managed workflow restart reports `SERVER unexpectedly disconnected`, produces no workflow log, and leaves the workflow not started, treat it as a control-plane failure rather than evidence that the application crashed.

**Why:** Repeated restart attempts failed before launching the configured command even though static checks passed and the same command served the application correctly when launched directly.

**How to apply:** Check listeners, workflow status, configuration, and logs first. If no process or new log exists, validate with the exact configured command rather than modifying healthy application code to address a nonexistent port or startup bug.