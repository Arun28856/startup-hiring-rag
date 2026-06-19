const React = require('react')

// Returns a lightweight <span> for every icon so tests don't need ESM transform
module.exports = new Proxy(
  {},
  {
    get: (_target, name) =>
      function Icon({ size, className, ...rest }) {
        return React.createElement('span', { 'data-icon': name, className, ...rest })
      },
  }
)
