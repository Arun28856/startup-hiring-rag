const React = require('react')

function useTheme() {
  return { theme: 'light', setTheme: jest.fn(), resolvedTheme: 'light' }
}

function ThemeProvider({ children }) {
  return children
}

module.exports = { useTheme, ThemeProvider }
