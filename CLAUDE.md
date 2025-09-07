# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quality Assurance

### Quality Standards

This project maintains the following quality standards:

1. **Zero type errors**: Maintain 0 TypeScript errors at all times
2. **Build success**: All builds must succeed without errors
3. **No `any` types**: Avoid using `any` type - use proper typing instead
4. **No non-null assertions**: Avoid using `!` operator - use proper null checks

## Development Philosophy

### AI-Driven Development

This project leverages Claude Code for comprehensive code generation and maintenance. All implementation follows AI-assisted development patterns with emphasis on:

- Automated code generation with human oversight
- Consistent coding standards across frontend and backend
- Type-safe implementations throughout the monorepo

### Core Principles

#### UNIX Philosophy

Write programs that do one thing and do it well. Write programs to work together. Choose portability over efficiency, clarity over cleverness.

- **Frontend**: Single-responsibility components with clear interfaces
- **Backend**: Focused API endpoints with minimal coupling
- **Monorepo**: Independent apps that communicate through well-defined contracts

#### Don't Reinvent the Wheel

Leverage existing, proven solutions before implementing custom alternatives. Research available libraries, frameworks, and tools first.

- Prefer established Vue 3 ecosystem solutions
- Use proven Hono middleware and plugins
- Leverage existing TypeScript patterns and utilities

#### Orthogonality Principle

Design independent, loosely coupled components where changes to one component have minimal impact on others. Maintain clear separation of concerns and avoid unexpected interdependencies.

- **Frontend/Backend Separation**: Clear API boundaries
- **Component Independence**: Minimal cross-dependencies
- **Service Layer Isolation**: Business logic separated from presentation

#### Type-Driven Development

Apply TDD principles to static type checking:

1. **Incremental Type Checking**: Check types as you develop
2. **Early Error Detection**: Catch type errors during development
3. **Progressive Integration**: Maintain type safety across app boundaries

#### DRY (Don't Repeat Yourself)

Each piece of knowledge must have a single, unambiguous, authoritative representation within the system.

- Shared types between frontend and backend
- Reusable components and utilities
- Common configuration patterns

#### KISS (Keep It Simple, Stupid)

Choose the simplest solution that fully addresses the problem. Avoid over-engineering.

- Simple component hierarchies
- Straightforward API design
- Clear data flow patterns

#### SOLID Principles

- **S**ingle Responsibility: One class/component, one responsibility
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes substitutable for base types
- **I**nterface Segregation: Many specific interfaces over one general
- **D**ependency Inversion: Depend on abstractions, not concretions

#### Test-Driven Development

Follow the RED-GREEN-BLUE cycle for all development:

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **BLUE**: Refactor while keeping tests green

Apply TDD across both frontend and backend components with appropriate testing strategies for each layer.
