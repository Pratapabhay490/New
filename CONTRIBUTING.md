# Contributing to StudySync

Thank you for your interest in contributing to StudySync! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Follow best practices

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/studysync/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, browser, Node version)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with "Feature Request" label
3. Clearly describe the feature and its use case
4. Explain why this feature would be useful

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the existing code style
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Provide a clear description
   - Link related issues
   - Wait for review

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/studysync.git

# Install dependencies
pnpm install

# Setup environment
./infrastructure/scripts/setup.sh

# Start development servers
pnpm dev
```

## Code Style

- TypeScript for all code
- ESLint + Prettier for formatting
- Follow existing patterns
- Write self-documenting code
- Add comments for complex logic

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add screen recording feature
fix: resolve WebRTC connection issue
docs: update deployment guide
```

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Test manually in multiple browsers

## Questions?

Feel free to open an issue or reach out to maintainers.

Thank you for contributing! 🎉
