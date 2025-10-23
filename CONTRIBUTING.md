# Contributing to Community Safe Path

Thank you for your interest in contributing to Community Safe Path! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Guidelines](#issue-guidelines)
8. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers
- ✅ Be collaborative
- ✅ Provide constructive feedback
- ✅ Focus on what is best for the community

### Unacceptable Behavior

- ❌ Harassment or discrimination
- ❌ Trolling or insulting comments
- ❌ Personal or political attacks
- ❌ Publishing others' private information
- ❌ Other unprofessional conduct

---

## Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- npm 8.x or higher
- Git
- Code editor (VS Code recommended)
- MongoDB (local or Atlas)

### Fork and Clone

1. **Fork the repository**
   - Click "Fork" button on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/community-safe-path.git
   cd community-safe-path
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/KelvinDube514/community-safe-path.git
   ```

### Setup Development Environment

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run dev
   ```

3. **Verify Setup**
   - Backend: http://localhost:5000
   - Frontend: http://localhost:8080
   - Run tests: `npm test`

---

## Development Workflow

### Branch Strategy

```
main (production)
  ├── develop (development)
  │   ├── feature/your-feature
  │   ├── bugfix/your-bugfix
  │   └── hotfix/your-hotfix
```

### Creating a Branch

1. **Update your fork**
   ```bash
   git checkout develop
   git pull upstream develop
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

**Examples**:
- `feature/add-email-notifications`
- `bugfix/fix-map-marker-display`
- `docs/update-api-documentation`

### Making Changes

1. **Write code**
   - Follow coding standards
   - Write tests
   - Update documentation

2. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add email notifications"
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): add password reset functionality

Implement password reset via email with secure tokens.
Tokens expire after 1 hour.

Closes #123
```

```
fix(map): correct marker clustering issue

Fixed bug where markers weren't clustering properly
at certain zoom levels.

Fixes #456
```

---

## Coding Standards

### JavaScript/TypeScript

**Style Guide**: Follow Airbnb JavaScript Style Guide

**Key Points**:
- Use ES6+ features
- Prefer `const` over `let`
- Use arrow functions
- Use template literals
- Destructure when possible
- Use async/await over promises

**Example**:
```typescript
// ✅ Good
const getUserById = async (id: string): Promise<User> => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// ❌ Bad
function getUserById(id) {
  return User.findById(id).then(function(user) {
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });
}
```

### React Components

**Functional Components**:
```typescript
// ✅ Good
interface Props {
  title: string;
  onClose: () => void;
}

export const Modal: React.FC<Props> = ({ title, onClose }) => {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

// ❌ Bad
export function Modal(props) {
  return (
    <div>
      <h2>{props.title}</h2>
      <button onClick={props.onClose}>Close</button>
    </div>
  );
}
```

### File Organization

```
src/
├── components/
│   ├── ComponentName/
│   │   ├── ComponentName.tsx
│   │   ├── ComponentName.test.tsx
│   │   ├── ComponentName.styles.ts (if needed)
│   │   └── index.ts
├── services/
│   ├── ServiceName.ts
│   └── ServiceName.test.ts
├── hooks/
│   ├── useHookName.ts
│   └── useHookName.test.ts
└── utils/
    ├── utilityName.ts
    └── utilityName.test.ts
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`, `ApiResponse`)

### Code Formatting

**Use Prettier**:
```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

**ESLint**:
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## Testing Guidelines

### Test Coverage

- Aim for 80%+ code coverage
- Write tests for all new features
- Update tests when modifying code
- Test edge cases and error scenarios

### Writing Tests

**Unit Tests**:
```typescript
// Component test
describe('AlertCard', () => {
  it('renders alert information', () => {
    render(<AlertCard alert={mockAlert} />);
    expect(screen.getByText('Test Alert')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<AlertCard alert={mockAlert} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Integration Tests**:
```javascript
// API endpoint test
describe('POST /api/incidents', () => {
  it('should create a new incident', async () => {
    const response = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send(incidentData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.incident).toBeDefined();
  });
});
```

### Running Tests

```bash
# Backend
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Frontend
cd frontend
npm test                    # Unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:e2e            # E2E tests
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts with develop branch

### Creating Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

2. **Open Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in PR template

3. **PR Title Format**
   ```
   [Type] Brief description

   Examples:
   [Feature] Add email notifications
   [Bugfix] Fix map marker clustering
   [Docs] Update API documentation
   ```

4. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] E2E tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   Add screenshots here

   ## Related Issues
   Closes #123
   Related to #456

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

### Review Process

1. **Automated Checks**
   - Tests must pass
   - Linting must pass
   - Build must succeed

2. **Code Review**
   - At least one approval required
   - Address review comments
   - Update PR as needed

3. **Merge**
   - Squash and merge (preferred)
   - Delete branch after merge

---

## Issue Guidelines

### Creating Issues

**Bug Report Template**:
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
Add screenshots if applicable

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 96]
- Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information
```

**Feature Request Template**:
```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Mockups, examples, etc.
```

### Issue Labels

- `bug` - Something isn't working
- `feature` - New feature request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation updates
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority
- `priority: low` - Low priority

---

## Community

### Communication Channels

- **GitHub Discussions**: General discussions
- **GitHub Issues**: Bug reports and features
- **Discord**: [Join our server](https://discord.gg/community-safe-path)
- **Email**: dev@communitysafepath.com

### Getting Help

- Check existing issues and discussions
- Read documentation thoroughly
- Ask in Discord #help channel
- Create a GitHub discussion

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project website

---

## Development Tips

### Useful Commands

```bash
# Backend
npm run dev              # Start dev server
npm test                 # Run tests
npm run lint             # Lint code
npm run format           # Format code

# Frontend
npm run dev              # Start dev server
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run build            # Build for production
npm run preview          # Preview production build

# Both
npm run lint:fix         # Fix linting issues
npm run format           # Format all files
```

### Debugging

**Backend**:
```bash
# Debug mode
node --inspect-brk src/server.js

# VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/src/server.js"
}
```

**Frontend**:
- Use React DevTools
- Use browser DevTools
- Check console for errors
- Use debugger statements

### Common Issues

**Port Already in Use**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**Module Not Found**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Tests Failing**:
```bash
# Clear test cache
npm test -- --clearCache

# Run specific test
npm test -- path/to/test.js
```

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Feel free to ask questions:
- Open a GitHub Discussion
- Ask in Discord
- Email: dev@communitysafepath.com

---

**Thank you for contributing to Community Safe Path! 🛡️**

*Together, we're making communities safer.*
