# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - status: "Error: local service error"
  - heading "Next.js Chat App" [level=1]
  - paragraph: Send messages to local or remote endpoints
  - log "Chat message history":
    - list "2 messages":
      - listitem "user message from 12:23 PM": Test error clear 12:23 PM
      - listitem "error message from 12:23 PM": local service is temporarily unavailable (Error 500). Please try again later. 12:23 PM
  - text: Type your message
  - textbox "Message input": New message
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080": Send to Local
  - button "Send message to remote endpoint": Send to Remote
  - button "Clear chat history": Clear Chat
- alert
```