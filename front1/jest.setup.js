import '@testing-library/jest-dom'

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = jest.fn();