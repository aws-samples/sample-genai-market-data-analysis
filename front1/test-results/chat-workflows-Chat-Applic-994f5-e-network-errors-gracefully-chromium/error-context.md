# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - status
  - heading "Next.js Chat App" [level=1]
  - paragraph: Send messages to local or remote endpoints
  - log "Chat message history":
    - list "1 messages":
      - listitem "user message from 12:17 PM": Test network error 12:17 PM
      - status "Loading message"
  - text: Type your message
  - textbox "Message input" [disabled]
  - text: Sending... Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080" [disabled]: Sending...
  - button "Send message to remote endpoint" [disabled]: Sending...
  - button "Clear chat history" [disabled]: Clear Chat
  - text: Send to local endpoint (127.0.0.1:8080) Send to configured remote endpoint Remove all messages from chat history
- alert
```