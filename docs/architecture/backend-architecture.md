# Backend Architecture

## Service Architecture

Traditional Next.js API routes with persistent server processes organized by feature domains (auth, evaluations, documents, subscriptions, progress).

## Database Architecture

Repository pattern implementation with BaseRepository class and specialized repositories for each domain entity, providing clean data access layer with type safety.

## Authentication and Authorization

JWT-based authentication with Supabase integration, comprehensive middleware for auth, rate limiting, and error handling.
