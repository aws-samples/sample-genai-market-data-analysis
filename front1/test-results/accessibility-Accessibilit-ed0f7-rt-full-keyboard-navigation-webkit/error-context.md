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
  - textbox "Message input": Keyboard test
  - text: Press Enter to send, Shift+Enter for new line
  - button "Send message to local endpoint at 127.0.0.1:8080": Send to Local
  - button "Send message to remote endpoint": Send to Remote
  - button "Clear chat history": Clear Chat
  - text: Send to local endpoint (127.0.0.1:8080) Send to configured remote endpoint Remove all messages from chat history
- alert
```