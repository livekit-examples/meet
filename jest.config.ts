/* eslint-disable */
import type { Config } from 'jest'

export default async (): Promise<Config> => {
  return {
    verbose: true,
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/src/tests/beforeSetupTests.tsx'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/afterSetupTest.ts'],
    transform: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        '<rootDir>/src/tests/config/fileTransformer.cjs',
      '^.+\\.(t|j)sx?$': '@swc/jest'
    },
    moduleNameMapper: {
      '\\.(css|less)$': 'identity-obj-proxy'
    },
    transformIgnorePatterns: ['node_modules/(?!(multiformats|uint8arrays)/)']
  }
}
