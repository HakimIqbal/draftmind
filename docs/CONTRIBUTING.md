# Contributing

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, missing semicolons, etc.                    |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `chore`    | Build process, tooling, dependencies                    |

### Scopes

`auth`, `dashboard`, `editor`, `generate`, `export`, `db`, `ui`, `ai`, `deploy`, `docs`

### Examples

```
feat(editor): add slash menu with AI suggestion options
fix(auth): handle expired magic link redirect
chore(db): add migration for prd_templates index
docs(api): document AI review endpoint
test(ui): add pill component status color tests
```

## Branch Strategy

- `main` — production-ready code
- `phase-N` — development branch per phase
- Feature branches from phase branch when needed

## Pre-commit

Husky runs automatically on commit:

- `pnpm typecheck` — TypeScript validation
- `lint-staged` — ESLint + Prettier on staged files
