# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (starts on http://localhost:3000)
- **Build**: `npm run build`
- **Start production**: `npm start`
- **Lint**: `npm run lint`
- **Tests**:
  - `npm test` (run all Jest tests)
  - `npm run test:watch` (Jest in watch mode)
  - `npm run test:integration` (integration tests using tsx)

## Project Architecture

This is a Next.js 15 application using the App Router pattern for a GitHub Actions workflow dashboard. The application monitors GitHub workflows across repositories with real-time status updates.

### Core Architecture

**Context-Based State Management**:

- Multiple React contexts provide application-wide state management
- Context hierarchy (outermost to innermost): Theme → DisplaySettings → GitHubToken → RepositorySelection → Workflow
- All contexts are located in `src/contexts/` and follow the provider pattern

**Main Contexts**:

- `GitHubTokenProvider`: Manages GitHub token authentication and secure storage
- `RepositorySelectionProvider`: Handles repository selection and filtering
- `WorkflowProvider`: Manages workflow data and auto-refresh functionality
- `ThemeProvider`: Dark/light theme management
- `DisplaySettingsProvider`: UI preferences and refresh intervals

**Component Structure**:

- `WorkflowDashboard`: Main dashboard component that orchestrates the entire UI
- `RepositorySelection`: Repository picker and filtering interface
- UI components in `src/components/ui/` following shadcn/ui patterns
- All components use Tailwind CSS with custom design system

**API Layer**:

- `GitHubApiClient` class in `src/lib/api/github.ts` handles all GitHub API interactions
- Type definitions in `src/lib/api/types.ts` for GitHub API responses
- Token validation and user authentication in `src/lib/api/token-validation.ts`

**Security & Storage**:

- Secure storage implementation in `src/lib/storage/secure-storage.ts`
- GitHub tokens stored securely using browser APIs when available
- Fallback to localStorage with appropriate warnings

### Key Features

**Real-time Workflow Monitoring**:

- Auto-refresh functionality with configurable intervals (30s, 1min, 2min, 5min)
- Status-based filtering and repository selection
- Unified color system for workflow statuses across the application

**User-Centric Features**:

- "About Me" functionality that filters workflows by the authenticated user
- Repository hiding/showing with persistent state
- Responsive design with mobile-first approach

### Status Color System

The application uses a unified status color system defined in `src/lib/status-colors.ts`:

- Success: Green variants
- Failure: Red variants
- In Progress/Running: Blue variants
- Queued/Waiting: Yellow/amber variants
- Cancelled/Skipped: Gray variants

All status indicators (badges, icons, backgrounds) must use these consistent colors.

### Testing Strategy

**Test Structure**:

- Unit tests using Jest and React Testing Library
- Integration tests in `__tests__/` directory
- Comprehensive GitHub API testing
- Repository loading and filtering flow tests

**Test Files of Note**:

- `github-api.test.ts`: GitHub API client tests
- `workflow-dashboard-integration.test.ts`: Main dashboard integration tests
- `secure-storage.test.ts`: Security and storage tests

### Development Patterns

**Component Patterns**:

- Use `'use client'` directive for client-side components
- Follow the established context patterns for state management
- Use Lucide React for icons consistently
- Implement responsive design with Tailwind breakpoints

**API Patterns**:

- All GitHub API calls go through the `GitHubApiClient` class
- Error handling uses custom `GitHubApiError` class
- Rate limiting awareness (GitHub API has limits)

**State Management**:

- Use contexts for cross-component state
- Local state with `useState` for component-specific data
- Persistent storage through secure storage utility

## UI Framework

Uses shadcn/ui components with:

- Tailwind CSS for styling
- Radix UI primitives for accessibility
- Custom design tokens in neutral color scheme
- Responsive design patterns
