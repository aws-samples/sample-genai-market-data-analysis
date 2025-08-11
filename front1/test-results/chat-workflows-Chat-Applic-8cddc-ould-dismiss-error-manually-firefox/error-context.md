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
      - listitem "user message from 12:19 PM": Test dismiss error 12:19 PM
      - listitem "error message from 12:19 PM": local service is temporarily unavailable (Error 500). Please try again later. 12:19 PM
  - text: Type your message
  - textbox "Message input"
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080" [disabled]: Send to Local
  - button "Send message to remote endpoint" [disabled]: Send to Remote
  - button "Clear chat history": Clear Chat
  - text: Send to local endpoint (127.0.0.1:8080) Send to configured remote endpoint Remove all messages from chat history
- alert
```