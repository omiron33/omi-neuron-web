# Contributing to omi-neuron-web

Thank you for your interest in contributing to omi-neuron-web!

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)
- OpenAI API key

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/omi-neuron-web.git
cd omi-neuron-web

# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test
```

## Project Structure

See `CLAUDE.md` for detailed architecture documentation.

```
src/
├── core/           # Types, schemas, analysis engine
├── storage/        # Database layer
├── api/            # REST API routes
├── visualization/  # Three.js component
├── react/          # React hooks and provider
└── cli/            # CLI commands
```

## Development Workflow

### 1. Pick a Task

Check `plans/next-step.json` for the current task queue. Read the corresponding task file in `tasks/`.

### 2. Make Changes

- Follow the code style (TypeScript strict, Zod validation)
- Write tests for new functionality
- Update types and exports as needed

### 3. Validate

```bash
pnpm typecheck   # Check types
pnpm lint        # Check linting
pnpm test        # Run tests
```

### 4. Submit PR

- Create a branch from `main`
- Write descriptive commit messages
- Include tests for new features
- Update documentation if needed

## Code Style

- **TypeScript**: Strict mode, no `any` types
- **Validation**: Zod for all runtime validation
- **Exports**: Named exports, updated index files
- **Documentation**: JSDoc on public APIs
- **Testing**: Vitest, tests in `tests/` directory

## Commit Messages

Follow conventional commits:

```
feat: add semantic search endpoint
fix: correct embedding dimension handling
docs: update API documentation
test: add clustering engine tests
```

## Pull Request Guidelines

1. Reference related issues
2. Describe what changed and why
3. Include screenshots for UI changes
4. Ensure all checks pass
5. Request review from maintainers

## Questions?

Open an issue or discussion for:
- Bug reports
- Feature requests
- Questions about the codebase
- Contribution guidance

## License

By contributing, you agree that your contributions will be licensed under the ISC License.


