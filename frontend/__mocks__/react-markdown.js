const React = require('react')

// Render markdown content as plain text so tests can assert on it
function ReactMarkdown({ children }) {
  return React.createElement('div', { 'data-testid': 'markdown' }, children)
}

module.exports = ReactMarkdown
module.exports.default = ReactMarkdown
