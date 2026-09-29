import {nextJest} from 'next/jest'

const createJestConfig = nextJest({
	dir: './',
})

const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
	collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
}

export default createJestConfig(customJestConfig)
