module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      presets: [
        '@babel/preset-env',
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^framer-motion$': '<rootDir>/__mocks__/framer-motion.js',
    '^next-themes$': '<rootDir>/__mocks__/next-themes.js',
    '^react-markdown$': '<rootDir>/__mocks__/react-markdown.js',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testMatch: ['**/__tests__/**/*.test.tsx'],
}
