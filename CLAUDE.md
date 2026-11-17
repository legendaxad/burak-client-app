# BURAK Customer Mobile — Project Instructions

## Project Identity

This repository contains the BURAK Customer Mobile Application.

- Application: BURAK Customer
- Platforms: Android and iOS
- Framework: React Native + TypeScript
- Backend: Existing BURAK Express + TypeScript API
- Architecture: Feature-based modular architecture

This is a CUSTOMER application, not an Admin application.

## 1. Core Development Rules

- Think and work like a senior React Native engineer.
- Prioritize maintainability, scalability, and separation of concerns.
- Use strict TypeScript.
- Avoid `any`.
- Keep components small and reusable.
- Keep business logic outside UI components.
- Never create a giant App.tsx or global context containing everything.
- Avoid duplicated logic.
- Avoid unnecessary dependencies and abstractions.
- Do not silently ignore errors.
- Do not use fake data to hide incomplete API integration.

## 2. Architecture

Follow feature-based architecture.

Each feature should own its:

- Screens
- Components
- Hooks
- Services
- Types
- Validation

Shared functionality belongs in appropriate shared directories.

Never mix:

- UI and API logic.
- Backend services and mobile services.
- Customer and Admin functionality.
- Server state and local UI state.

## 3. Backend Integration

The existing BURAK backend is the source of truth.

Before implementing an API integration:

1. Inspect the corresponding backend router.
2. Inspect its controller.
3. Inspect its service.
4. Inspect its Mongoose schema.
5. Confirm request and response structures.

Never invent endpoints or response properties.

Use a centralized Axios client.

Handle:

- Authentication
- API errors
- Loading states
- Network failures
- Pagination
- Request cancellation where appropriate

The backend currently uses JWT authentication and cookies. Verify the actual authentication contract before implementing mobile authentication.

Never store sensitive credentials in plain AsyncStorage.

## 4. State Management

Use:

- TanStack Query for remote/server data.
- Zustand for client-side state.
- SecureStore for sensitive authentication persistence.
- AsyncStorage for appropriate non-sensitive persistent settings.

Avoid unnecessary global state.

Do not duplicate server data inside Zustand when TanStack Query can manage it.

## 5. Code Organization

- Use clear and consistent file naming.
- Keep feature-specific types inside their feature.
- Keep globally shared types in src/types.
- Keep reusable UI components in src/components.
- Keep API configuration in src/services/api.
- Keep theme tokens in src/theme.
- Keep utility functions in src/utils.

Do not create files without a clear responsibility.

## 6. UI/UX

- Maintain consistent spacing, typography, and colors.
- Build reusable design-system components.
- Respect Android and iOS safe areas.
- Support different device sizes.
- Handle keyboard behavior correctly.
- Provide loading, empty, error, and success states.
- Use animations only where they improve UX.
- Maintain accessibility and touch-target standards.

## 7. Cross-Platform Requirements

Every feature must be considered for both Android and iOS.

- Avoid unnecessary platform-specific implementations.
- Use Platform.OS only when genuinely necessary.
- Test navigation and safe areas on both platforms.
- Handle permissions appropriately.
- Do not assume Android behavior is identical to iOS.

## 8. Testing and Quality

After implementation:

- Run TypeScript checks.
- Run linting.
- Run relevant tests.
- Verify API integration.
- Fix introduced errors.
- Check Android and iOS compatibility.

Never claim a feature is complete without verifying it.

## 9. Git and Project Safety

- Never overwrite existing work without inspection.
- Never delete files without understanding their purpose.
- Never modify the backend repository unless explicitly requested.
- Never commit secrets or environment files.
- Keep changes focused and reviewable.
- Do not reset or force-push Git history without explicit permission.

## 10. Working Method

Work in small, controlled phases.

Before implementation:

- Inspect existing code.
- Explain the proposed changes.
- Identify dependencies and risks.

After each phase, report:

1. What was implemented.
2. Which files were changed.
3. Tests executed and their results.
4. Known limitations.
5. Recommended next phase.

Wait for approval before moving to the next major phase.

## Most Important Principle

Build a clean, production-quality BURAK Customer application.

Correct architecture and real backend compatibility are more important than writing code quickly.

Never mix unrelated responsibilities or create unnecessary complexity.
