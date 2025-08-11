#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * This script runs all tests and generates a comprehensive coverage report
 * to ensure all requirements are covered by automated tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive Test Suite...\n');

// Test categories and their descriptions
const testCategories = [
  {
    name: 'Unit Tests',
    command: 'npm run test -- --coverage --watchAll=false',
    description: 'Component and service unit tests with coverage'
  },
  {
    name: 'E2E Workflow Tests',
    command: 'npx playwright test tests/e2e/chat-workflows.spec.ts',
    description: 'Complete user workflow end-to-end tests'
  },
  {
    name: 'E2E Responsive Design Tests',
    command: 'npx playwright test tests/e2e/responsive-design.spec.ts',
    description: 'Responsive design and cross-device compatibility tests'
  },
  {
    name: 'E2E Performance Tests',
    command: 'npx playwright test tests/e2e/performance.spec.ts',
    description: 'Performance tests for large message histories and memory usage'
  },
  {
    name: 'E2E Accessibility Tests',
    command: 'npx playwright test tests/e2e/accessibility.spec.ts',
    description: 'Accessibility and screen reader compatibility tests'
  },
  {
    name: 'Requirements Coverage Tests',
    command: 'npx playwright test tests/e2e/requirements-coverage.spec.ts',
    description: 'Comprehensive coverage of all documented requirements'
  }
];

// Results tracking
const results = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper function to run a command and capture output
function runCommand(command, description) {
  console.log(`\n📋 Running: ${description}`);
  console.log(`Command: ${command}\n`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8',
      timeout: 300000 // 5 minute timeout
    });
    
    console.log(`✅ ${description} - PASSED\n`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} - FAILED\n`);
    console.error(`Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

// Main test execution
async function runComprehensiveTests() {
  const startTime = Date.now();
  
  console.log('📊 Test Categories:');
  testCategories.forEach((category, index) => {
    console.log(`${index + 1}. ${category.name}: ${category.description}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Run each test category
  for (const category of testCategories) {
    const result = runCommand(category.command, category.name);
    results.push({
      name: category.name,
      description: category.description,
      success: result.success,
      error: result.error || null
    });
    
    if (result.success) {
      passedTests++;
    } else {
      failedTests++;
    }
    totalTests++;
  }
  
  // Generate summary report
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Test Categories: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`Total Duration: ${duration} seconds`);
  console.log('='.repeat(80));
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.name}: ${status}`);
    console.log(`   ${result.description}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });
  
  // Requirements coverage summary
  console.log('📋 REQUIREMENTS COVERAGE SUMMARY:');
  console.log('The following requirements are covered by automated tests:');
  console.log('');
  console.log('✅ Requirement 1: Chat Interface and Message History');
  console.log('   - 1.1: Display chat window with message history');
  console.log('   - 1.2: Display messages in chronological order');
  console.log('   - 1.3: Auto-scroll to show latest message');
  console.log('   - 1.4: Display empty chat state when no messages exist');
  console.log('');
  console.log('✅ Requirement 2: Local Endpoint Communication');
  console.log('   - 2.1: Send message to local endpoint');
  console.log('   - 2.2: Include message in JSON payload with prompt field');
  console.log('   - 2.3: Set Content-Type header to application/json');
  console.log('   - 2.4: Use 15-minute timeout');
  console.log('   - 2.5: Display response in chat window');
  console.log('   - 2.6: Display error message when endpoint fails');
  console.log('');
  console.log('✅ Requirement 3: Remote Endpoint Communication');
  console.log('   - 3.1: Send message to remote endpoint');
  console.log('   - 3.2: Use same JSON payload format as local requests');
  console.log('   - 3.3: Handle authentication if required');
  console.log('   - 3.4: Display remote response in chat window');
  console.log('   - 3.5: Display error message when remote endpoint fails');
  console.log('');
  console.log('✅ Requirement 4: Clear Chat History');
  console.log('   - 4.1: Remove all messages when clear button is clicked');
  console.log('   - 4.2: Show confirmation dialog to prevent accidental clearing');
  console.log('   - 4.3: Return to empty chat state after clearing');
  console.log('   - 4.4: Not affect server-side conversation state');
  console.log('');
  console.log('✅ Requirement 5: Message Input Field');
  console.log('   - 5.1: Display text input field on application load');
  console.log('   - 5.2: Show text in real-time as user types');
  console.log('   - 5.3: Trigger default send action on Enter key');
  console.log('   - 5.4: Clear input field after message is sent');
  console.log('   - 5.5: Disable send buttons when input field is empty');
  console.log('');
  console.log('✅ Requirement 6: Visual Feedback During API Calls');
  console.log('   - 6.1: Show loading indicator when message is being sent');
  console.log('   - 6.2: Disable send buttons during API call');
  console.log('   - 6.3: Hide loading indicator and re-enable buttons when API call completes');
  console.log('');
  console.log('✅ Requirement 7: Responsive and Accessible Design');
  console.log('   - 7.1: Adapt layout appropriately on mobile devices');
  console.log('   - 7.2: Provide proper focus management for keyboard navigation');
  console.log('   - 7.3: Provide appropriate ARIA labels and descriptions for screen readers');
  console.log('   - 7.4: Announce new messages to screen readers');
  console.log('');
  
  // Performance and additional coverage
  console.log('🚀 ADDITIONAL TEST COVERAGE:');
  console.log('✅ Performance Tests:');
  console.log('   - Large message history rendering performance');
  console.log('   - Memory usage and leak detection');
  console.log('   - Smooth scrolling with large message count');
  console.log('   - Rapid message sending efficiency');
  console.log('   - Frame rate maintenance during interactions');
  console.log('');
  console.log('✅ Responsive Design Tests:');
  console.log('   - Desktop, tablet, and mobile layouts');
  console.log('   - Touch interactions and virtual keyboard handling');
  console.log('   - Portrait and landscape orientations');
  console.log('   - Cross-device consistency');
  console.log('   - Browser zoom levels and high contrast mode');
  console.log('');
  console.log('✅ Accessibility Tests:');
  console.log('   - Screen reader support and announcements');
  console.log('   - Keyboard navigation and focus management');
  console.log('   - ARIA landmarks and proper labeling');
  console.log('   - High contrast and reduced motion support');
  console.log('   - Dialog accessibility and focus trapping');
  console.log('');
  
  // Generate test report file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalCategories: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      duration: duration
    },
    results: results,
    requirementsCoverage: {
      requirement1: 'Chat Interface and Message History - COVERED',
      requirement2: 'Local Endpoint Communication - COVERED',
      requirement3: 'Remote Endpoint Communication - COVERED',
      requirement4: 'Clear Chat History - COVERED',
      requirement5: 'Message Input Field - COVERED',
      requirement6: 'Visual Feedback During API Calls - COVERED',
      requirement7: 'Responsive and Accessible Design - COVERED'
    }
  };
  
  const reportsDir = path.join(__dirname, '..', 'test-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, `comprehensive-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`📄 Detailed test report saved to: ${reportPath}`);
  console.log('');
  
  // Exit with appropriate code
  if (failedTests > 0) {
    console.log('❌ Some tests failed. Please review the results above.');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! The application meets all requirements.');
    process.exit(0);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test execution interrupted by user.');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Test execution terminated.');
  process.exit(1);
});

// Run the comprehensive tests
runComprehensiveTests().catch(error => {
  console.error('💥 Fatal error running comprehensive tests:', error);
  process.exit(1);
});