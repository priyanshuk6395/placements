
# Placement Tracker

## Overview

Placement Tracker is a robust, production-grade web application designed to streamline and manage campus placement data. Built with Next.js, React, TypeScript, and Tailwind CSS, it leverages modern authentication, modular architecture, and scalable best practices. The project is engineered for maintainability, extensibility, and high performance.

## Features

- **Next.js App Router**: SSR, SSG, and API routes for optimal performance and flexibility.
- **TypeScript**: Strict typing, interfaces, and type safety across the codebase.
- **Tailwind CSS**: Utility-first styling for rapid UI development.
- **Authentication**: Secure login via NextAuth.js.
- **MongoDB Integration**: Persistent storage for placement records.
- **File Uploads**: Managed via API routes.
- **Dashboard**: Real-time stats, company logos, placement tables, and analytics.
- **Modular Components**: Reusable UI and dashboard elements.
- **Linting & Formatting**: ESLint, Prettier, and strict code quality enforcement.

## Folder Structure

```
src/
	app/           # Next.js app router, pages, layouts, API routes
		api/         # API endpoints (auth, upload)
		login/       # Login page
		components/  # UI and dashboard components
		lib/         # Database connection, utilities
		models/      # Mongoose schemas
public/          # Static assets
config/          # ESLint, Tailwind, PostCSS configs
```

## Setup & Installation

### Prerequisites
- Node.js >= 18
- npm >= 9
- MongoDB instance (local or cloud)

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```
MONGODB_URI=
LOGODEV_API_KEY=
NEXTAUTH_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
NEXTAUTH_URL=
```

### Development

```bash
npm run dev
```

### Build & Production

```bash
npm run build
npm start
```

### Lint & Format

```bash
npm run lint
npm run format
```

## Testing

> Add unit/integration tests as needed. Recommended: Jest, React Testing Library.

## Contributing

- Follow Conventional Commits.
- Write clear, maintainable code.
- Add tests for new features.
- Run lint and format before pushing.

## License

MIT

---

### Maintainer Notes

- Designed for extensibility: add new features with minimal refactoring.
- Modular, clean codebase: easy onboarding for new developers.
- Secure by default: authentication, input validation, and error handling.
- Performance optimized: SSR, SSG, and API caching.
- Production ready: strict linting, formatting, and CI/CD friendly.

For questions, open an issue or contact the maintainer.
