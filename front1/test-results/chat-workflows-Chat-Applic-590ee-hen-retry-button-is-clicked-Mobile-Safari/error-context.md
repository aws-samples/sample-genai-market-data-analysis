# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - status: "Error: local service error"
  - heading "Next.js Chat App" [level=1]
  - paragraph: Send messages to local or remote endpoints
  - alert:
    - heading "Error" [level=3]
    - paragraph: "local service error: Load failed"
    - button "Dismiss error"
  - log "Chat message history":
    - list "2 messages":
      - listitem "user message from 12:24 PM": Test retry success 12:24 PM
      - listitem "error message from 12:24 PM": "local service error: Load failed 12:24 PM"
  - text: Type your message
  - textbox "Message input"
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080" [disabled]: Send to Local
  - button "Send message to remote endpoint" [disabled]: Send to Remote
  - button "Clear chat history": Clear Chat
- alert
```