# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - status
  - heading "Next.js Chat App" [level=1]
  - paragraph: Send messages to local or remote endpoints
  - log "Chat message history":
    - list "20 messages":
      - listitem "user message from 12:22 PM": Message 1 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 1 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 2 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 2 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 3 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 3 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 4 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 4 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 5 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 5 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 6 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 6 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 7 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 7 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 8 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 8 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 9 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 9 12:22 PM(local)"
      - listitem "user message from 12:22 PM": Message 10 12:22 PM
      - listitem "assistant message from 12:22 PM": "Response to: Message 10 12:22 PM(local)"
  - text: Type your message
  - textbox "Message input"
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080" [disabled]: Send to Local
  - button "Send message to remote endpoint" [disabled]: Send to Remote
  - button "Clear chat history": Clear Chat
  - text: Send to local endpoint (127.0.0.1:8080) Send to configured remote endpoint Remove all messages from chat history
- alert
```