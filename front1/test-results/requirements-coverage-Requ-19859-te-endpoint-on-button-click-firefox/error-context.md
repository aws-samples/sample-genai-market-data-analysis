# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - status: "Error: Configuration error"
  - heading "Next.js Chat App" [level=1]
  - paragraph: Send messages to local or remote endpoints
  - alert:
    - heading "Error" [level=3]
    - paragraph: "Configuration error: Remote endpoint not configured"
    - button "Dismiss error"
  - log "Chat message history":
    - list "2 messages":
      - listitem "user message from 12:20 PM": Test remote endpoint 12:20 PM
      - listitem "error message from 12:20 PM": "Configuration error: Remote endpoint not configured 12:20 PM"
  - text: Type your message
  - textbox "Message input"
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080" [disabled]: Send to Local
  - button "Send message to remote endpoint" [disabled]: Send to Remote
  - button "Clear chat history": Clear Chat
  - text: Send to local endpoint (127.0.0.1:8080) Send to configured remote endpoint Remove all messages from chat history
- alert
```