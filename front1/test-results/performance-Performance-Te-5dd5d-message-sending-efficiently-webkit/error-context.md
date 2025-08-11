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
      - listitem "user message from 12:21 PM": Rapid message 1 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 1 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 2 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 2 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 3 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 3 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 4 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 4 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 5 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 5 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 6 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 6 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 7 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 7 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 8 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 8 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 9 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 9 12:21 PM(local)"
      - listitem "user message from 12:21 PM": Rapid message 10 12:21 PM
      - listitem "assistant message from 12:21 PM": "Response to: Rapid message 10 12:21 PM(local)"
  - text: Type your message
  - textbox "Message input"
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080" [disabled]: Send to Local
  - button "Send message to remote endpoint" [disabled]: Send to Remote
  - button "Clear chat history": Clear Chat
  - text: Send to local endpoint (127.0.0.1:8080) Send to configured remote endpoint Remove all messages from chat history
- alert
```