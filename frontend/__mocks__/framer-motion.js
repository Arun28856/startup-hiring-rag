const React = require('react')

// Strip animation props so DOM warnings are avoided
const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileFocus', 'layout', 'layoutId',
])

function makeMotionComponent(tag) {
  return React.forwardRef(function MotionElement({ children, ...props }, ref) {
    const domProps = Object.fromEntries(
      Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k))
    )
    return React.createElement(tag, { ...domProps, ref }, children)
  })
}

const motion = new Proxy(
  {},
  { get: (t, tag) => { if (!t[tag]) t[tag] = makeMotionComponent(tag); return t[tag] } }
)

function AnimatePresence({ children }) {
  return children || null
}

module.exports = { motion, AnimatePresence }
