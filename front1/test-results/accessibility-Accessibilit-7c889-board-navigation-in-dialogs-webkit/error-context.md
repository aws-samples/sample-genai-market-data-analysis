# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - status
  - heading "Next.js Chat App" [level=1]
  - paragraph: Send messages to local or remote endpoints
  - log "Chat message history":
    - status "No messages in chat":
      - img "Chat icon": 💬
      - heading "No messages yet" [level=3]
      - paragraph: Start a conversation by typing a message below
  - text: Type your message
  - textbox "Message input"
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080" [disabled]: Send to Local
  - button "Send message to remote endpoint" [disabled]: Send to Remote
  - button "Clear chat history": Clear Chat
  - text: Send to local endpoint (127.0.0.1:8080) Send to configured remote endpoint Remove all messages from chat history
  - dialog "Clear Chat History":
    - heading "Clear Chat History" [level=3]
    - paragraph: Are you sure you want to clear all messages? This action cannot be undone.
    - button "Cancel clearing chat": Cancel
    - button "Confirm clearing chat": Clear
- alert
```