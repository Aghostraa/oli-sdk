# Contributing to OLI SDK

Thank you for your interest in contributing to the Open Labels Initiative SDK! 🎉

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/openlabelsinitiative/OLI.git
   cd OLI/oli-sdk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the SDK**
   ```bash
   npm run build
   ```

4. **Run examples**
   ```bash
   cd examples
   npm install
   npm run basic
   ```

## Project Structure

```
oli-sdk/
├── src/
│   ├── index.ts           # Main entry point
│   ├── client.ts          # OLI client class
│   ├── fetcher.ts         # Data fetching utilities
│   ├── graphql.ts         # GraphQL query client
│   └── types/             # TypeScript type definitions
│       ├── common.ts
│       ├── client.ts
│       ├── tags.ts
│       └── attestation.ts
├── examples/              # Usage examples
├── dist/                  # Build output (generated)
└── package.json
```

## Development Guidelines

### Code Style

- Use TypeScript for all code
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

### Type Safety

- Avoid using `any` unless absolutely necessary
- Prefer `unknown` over `any` when type is uncertain
- Use type guards for runtime type checking
- Keep types flexible to support dynamic data from GitHub

### Key Design Principles

1. **Dynamic Types**: Types and value sets are fetched at runtime from GitHub
2. **No Hardcoding**: Avoid hardcoding enum values or tag definitions
3. **Browser Compatible**: Code must work in both Node.js and browsers
4. **Minimal Dependencies**: Keep dependencies to a minimum
5. **Type Safety**: Full TypeScript support with comprehensive types

### Adding New Features

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your feature**
   - Add types in `src/types/` if needed
   - Implement functionality in appropriate module
   - Update exports in `src/index.ts`
   - Add JSDoc comments

3. **Add examples**
   - Create example in `examples/` directory
   - Update `examples/README.md` if needed

4. **Update documentation**
   - Update main `README.md` with new features
   - Update `CHANGELOG.md` with changes
   - Add code examples for new APIs

5. **Test your changes**
   - Run the build: `npm run build`
   - Test with examples: `cd examples && npm run basic`
   - Manually test in a real project if possible

6. **Submit a pull request**
   - Provide clear description of changes
   - Link to any related issues
   - Ensure all checks pass

## Testing

Currently, the SDK uses manual testing with examples. We welcome contributions for:
- Unit tests setup
- Integration tests
- End-to-end tests

## Common Tasks

### Adding a New Method

1. Add method to appropriate class (`DataFetcher`, `GraphQLClient`, or `OLIClient`)
2. Add JSDoc comments explaining usage
3. Export any new types in `src/index.ts`
4. Add example usage in `README.md`

### Adding a New Type

1. Add type definition in `src/types/` appropriate file
2. Export type in `src/index.ts`
3. Document type in README if user-facing

### Supporting a New Network

1. Add network config to `NETWORKS` in `src/types/common.ts`
2. Update README with new network information

## Questions?

Feel free to:
- Open an issue for questions or discussions
- Join our community channels
- Reach out to maintainers

## Code of Conduct

Be respectful and constructive in all interactions. We're building this together! 🤝

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

