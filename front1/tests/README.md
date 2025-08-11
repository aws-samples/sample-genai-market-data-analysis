# Comprehensive Test Suite

This directory contains a comprehensive test suite for the Next.js Chat Application that ensures all requirements are covered by automated tests.

## Test Structure

### Unit Tests (`src/**/__tests__/`)
- **Component Tests**: Test individual React components in isolation
- **Service Tests**: Test API communication and business logic
- **Hook Tests**: Test custom React hooks
- **Utility Tests**: Test helper functions and utilities
- **Configuration Tests**: Test environment configuration and integration

### End-to-End Tests (`tests/e2e/`)
- **Workflow Tests**: Complete user workflows and interactions
- **Responsive Design Tests**: Cross-device compatibility and responsive behavior
- **Performance Tests**: Large message histories, memory usage, and rendering performance
- **Accessibility Tests**: Screen reader support, keyboard navigation, and ARIA compliance
- **Requirements Coverage Tests**: Explicit coverage of all documented requirements

## Test Categories

### 1. Unit Tests
```bash
npm run test
npm run test:watch  # Watch mode for development
```

**Coverage:**
- All React components with props, state, and event handling
- API service methods with mocked responses
- Custom hooks with various state scenarios
- Utility functions and data transformations
- Configuration loading and validation

### 2. End-to-End Workflow Tests
```bash
npx playwright test tests/e2e/chat-workflows.spec.ts
```

**Coverage:**
- Initial page load and interface display
- Local endpoint communication (send, receive, errors)
- Remote endpoint communication (send, receive, errors)
- Chat history management and clearing
- Error handling and recovery
- Loading states and user feedback

### 3. Responsive Design Tests
```bash
npx playwright test tests/e2e/responsive-design.spec.ts
```

**Coverage:**
- Desktop layout (1920x1080)
- Tablet layout (768x1024)
- Mobile layout (375x667)
- Touch interactions and virtual keyboard
- Portrait and landscape orientations
- Browser zoom levels and high contrast mode
- Performance on low-end devices

### 4. Performance Tests
```bash
npx playwright test tests/e2e/performance.spec.ts
```

**Coverage:**
- Large message history rendering (50+ messages)
- Memory usage and leak detection
- Smooth scrolling with large content
- Rapid message sending efficiency
- Frame rate maintenance during interactions
- DOM update performance
- Memory cleanup when chat is cleared

### 5. Accessibility Tests
```bash
npx playwright test tests/e2e/accessibility.spec.ts
```

**Coverage:**
- Screen reader support and announcements
- Keyboard navigation and focus management
- ARIA landmarks, labels, and descriptions
- High contrast and reduced motion support
- Dialog accessibility and focus trapping
- Live region updates for dynamic content

### 6. Requirements Coverage Tests
```bash
npx playwright test tests/e2e/requirements-coverage.spec.ts
```

**Coverage:**
- Explicit test for each requirement in the requirements document
- Verification of acceptance criteria
- End-to-end validation of user stories
- Complete functional coverage

## Running Tests

### Individual Test Categories
```bash
# Unit tests only
npm run test

# All E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode for E2E tests
npm run test:e2e:debug

# All tests (unit + E2E)
npm run test:all
```

### Comprehensive Test Suite
```bash
# Run all test categories with detailed reporting
npm run test:comprehensive
```

This command runs:
1. Unit tests with coverage
2. E2E workflow tests
3. E2E responsive design tests
4. E2E performance tests
5. E2E accessibility tests
6. Requirements coverage tests

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration
- JSDOM environment for component testing
- Module path mapping
- Setup files for test utilities

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile device emulation
- Automatic dev server startup
- Trace collection for debugging

## Requirements Coverage

### Requirement 1: Chat Interface and Message History ✅
- 1.1: Display chat window with message history
- 1.2: Display messages in chronological order
- 1.3: Auto-scroll to show latest message
- 1.4: Display empty chat state when no messages exist

### Requirement 2: Local Endpoint Communication ✅
- 2.1: Send message to local endpoint (http://127.0.0.1:8080/invocations)
- 2.2: Include message in JSON payload with "prompt" field
- 2.3: Set Content-Type header to application/json
- 2.4: Use 15-minute timeout (900 seconds)
- 2.5: Display response in chat window
- 2.6: Display error message when endpoint fails

### Requirement 3: Remote Endpoint Communication ✅
- 3.1: Send message to configurable remote endpoint
- 3.2: Use same JSON payload format as local requests
- 3.3: Handle authentication if required
- 3.4: Display remote response in chat window
- 3.5: Display error message when remote endpoint fails

### Requirement 4: Clear Chat History ✅
- 4.1: Remove all messages when clear button is clicked
- 4.2: Show confirmation dialog to prevent accidental clearing
- 4.3: Return to empty chat state after clearing
- 4.4: Not affect server-side conversation state

### Requirement 5: Message Input Field ✅
- 5.1: Display text input field on application load
- 5.2: Show text in real-time as user types
- 5.3: Trigger default send action on Enter key
- 5.4: Clear input field after message is sent
- 5.5: Disable send buttons when input field is empty

### Requirement 6: Visual Feedback During API Calls ✅
- 6.1: Show loading indicator when message is being sent
- 6.2: Disable send buttons during API call to prevent duplicates
- 6.3: Hide loading indicator and re-enable buttons when API call completes

### Requirement 7: Responsive and Accessible Design ✅
- 7.1: Adapt layout appropriately on mobile devices
- 7.2: Provide proper focus management for keyboard navigation
- 7.3: Provide appropriate ARIA labels and descriptions for screen readers
- 7.4: Announce new messages to screen readers

## Performance Benchmarks

### Message Rendering Performance
- **Target**: < 400ms average per message pair (user + response)
- **Large History**: Handle 50+ messages efficiently
- **Memory Usage**: < 10KB growth per message
- **Scroll Performance**: Smooth scrolling with 30+ messages

### Accessibility Standards
- **WCAG 2.1 AA Compliance**: All interactive elements
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Proper announcements and labeling
- **Focus Management**: Logical tab order and focus restoration

### Responsive Design Standards
- **Mobile First**: 375px minimum width support
- **Touch Targets**: Minimum 44px height for buttons
- **Viewport Adaptation**: 375px to 1920px width range
- **Performance**: < 10 second load time on slow 3G

## Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- MessageInput.test.tsx

# Run tests in watch mode with coverage
npm run test:watch -- --coverage

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Test Debugging
```bash
# Run with visible browser
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# Debug specific test
npx playwright test tests/e2e/chat-workflows.spec.ts --debug

# Generate trace for failed tests
npx playwright test --trace on
```

## Continuous Integration

The test suite is designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: npm run test -- --coverage --watchAll=false

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## Test Reports

Test reports are generated in the `test-reports/` directory:
- **Unit Test Coverage**: HTML coverage report
- **E2E Test Results**: Playwright HTML report
- **Comprehensive Report**: JSON summary of all test categories

## Contributing

When adding new features:

1. **Write Unit Tests**: Test components, services, and utilities
2. **Add E2E Tests**: Test complete user workflows
3. **Update Requirements Coverage**: Map tests to specific requirements
4. **Verify Accessibility**: Ensure keyboard and screen reader support
5. **Test Responsive Design**: Verify mobile, tablet, and desktop layouts
6. **Check Performance**: Ensure no performance regressions

## Troubleshooting

### Common Issues

**Tests failing in CI but passing locally:**
- Check Node.js version compatibility
- Verify environment variables are set
- Ensure browser dependencies are installed

**E2E tests timing out:**
- Increase timeout in playwright.config.ts
- Check for network issues or slow responses
- Verify mock server setup

**Accessibility tests failing:**
- Check ARIA labels and roles
- Verify keyboard navigation works
- Test with actual screen reader if possible

**Performance tests failing:**
- Check system resources during test run
- Verify memory limits and CPU throttling
- Review performance benchmarks for reasonableness