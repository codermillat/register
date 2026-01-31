---
name: fast-browser
description: High-performance browser automation for heavy scraping, multi-tab management, and precise DOM extraction. Use this when you need speed, reliability, or advanced state management (cookies/local storage) beyond standard web fetching.
metadata:
  requires: ["cargo", "google-chrome"]
---

# Fast Browser Use

A Rust-based browser automation library and MCP server for AI agents. It provides a lightweight binary that drives Chrome directly via CDP, optimized for token-efficient DOM extraction and robust session management.

## Capabilities & Tools

### Navigation & Lifecycle
- **navigate**: Visit a specific URL.
- **go_back** / **go_forward**: Traverse browser history.
- **wait**: Pause execution or wait for specific conditions.
- **new_tab**: Open a new browser tab.
- **switch_tab**: Switch focus to a specific tab.
- **close_tab**: Close the current or specified tab.
- **tab_list**: List all open tabs.
- **close**: Terminate the browser session.

### Interaction
- **click**: Click elements via CSS selectors or DOM indices.
- **input**: Type text into fields.
- **press_key**: Send specific keyboard events.
- **hover**: Hover over elements.
- **scroll**: Scroll the viewport.
- **select**: Choose options in dropdowns.

### Extraction & Analysis
- **extract**: Get structured data from the DOM.
- **markdown**: Convert the current page content to Markdown.
- **snapshot**: Capture the raw HTML snapshot.
- **screenshot**: Capture a visual image of the page.
- **read_links**: Extract hyperlinks from the page.
- **evaluate**: Execute custom JavaScript in the page context.

### State & Debugging
- **cookies**: Manage session cookies (get/set).
- **local_storage**: Manage local storage data.
- **debug**: Access console logs and debug information.

## Usage

This skill is specialized for complex web interactions that require maintaining state (like being logged in), handling dynamic JavaScript content, or managing multiple pages simultaneously. It offers higher performance and control compared to standard fetch-based tools.