# AI-Powered Collaborative Knowledge Hub

## Overview

This is a modern MERN stack application that enables teams to create, manage, and search knowledge documents with AI-powered features. The application combines traditional document management with artificial intelligence capabilities including automatic summarization, intelligent tagging, semantic search, and Q&A functionality. Built with TypeScript for type safety, it features a clean, responsive design and real-time collaboration capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses a modern React-based architecture with the following key decisions:
- **React 18 with TypeScript** for type safety and modern React features
- **Wouter for routing** instead of React Router for lightweight client-side navigation
- **TanStack Query** for server state management, caching, and background synchronization
- **Tailwind CSS with Shadcn UI** for consistent, utility-first styling and pre-built components
- **React Hook Form with Zod** for form handling and validation with type-safe schemas
- **Component-based architecture** with reusable UI components organized in a clear folder structure

### Backend Architecture
The server follows a RESTful API design with these architectural choices:
- **Express.js with TypeScript** for type-safe server development
- **JWT-based authentication** with role-based access control (user/admin roles)
- **Modular service layer** separating authentication, AI services, and storage logic
- **Storage abstraction** using an interface-based pattern that supports both memory storage (development) and database storage
- **Middleware-based request processing** for authentication, logging, and error handling

### Database Design
The application uses PostgreSQL with Drizzle ORM for database management:
- **Users table** with role-based permissions
- **Documents table** with versioning support and metadata
- **Document versions table** for complete change history tracking
- **Activities table** for audit trails and real-time activity feeds
- **Drizzle ORM** chosen for type-safe database operations and migrations

### AI Integration Strategy
The AI features are powered by Google's Gemini models with strategic model selection:
- **Gemini 2.5 Flash** for fast operations like summarization and tag generation
- **Gemini 2.5 Pro** for complex tasks like semantic search and Q&A
- **Modular AI service layer** that abstracts AI functionality from business logic
- **Custom prompting strategies** optimized for knowledge management use cases

### Authentication & Security
Security is implemented through multiple layers:
- **JWT tokens** for stateless authentication with 7-day expiration
- **bcryptjs** for secure password hashing
- **Role-based access control** with user and admin permissions
- **Token-based API authentication** for all protected endpoints

### State Management
The application uses a hybrid approach to state management:
- **TanStack Query** for server state with automatic caching and synchronization
- **React Context** for authentication state and user session management
- **Local state** using React hooks for component-specific state
- **Form state** managed by React Hook Form for optimal performance

## External Dependencies

### AI Services
- **Google Generative AI (Gemini)** - Powers all AI features including summarization, tagging, semantic search, and Q&A functionality
- **Custom prompting system** - Optimized prompts for knowledge management specific tasks

### Database & Storage
- **PostgreSQL** - Primary database for production environments
- **Neon Database** - Serverless PostgreSQL for cloud deployment
- **Drizzle ORM** - Type-safe database operations and migrations
- **In-memory storage** - Development and testing fallback

### UI & Styling
- **Radix UI primitives** - Accessible, unstyled component primitives for complex UI components
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Shadcn UI** - Pre-built component library built on Radix UI and Tailwind
- **Lucide React** - Icon library for consistent iconography

### Development & Build Tools
- **Vite** - Fast development server and build tool with HMR support
- **TypeScript** - Type safety across the entire application
- **ESBuild** - Fast bundling for production builds
- **PostCSS with Autoprefixer** - CSS processing and vendor prefixing

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing and verification
- **CORS** - Cross-origin request handling for API security

### Validation & Forms
- **Zod** - Runtime type validation and schema definition
- **React Hook Form** - Performance-optimized form handling
- **Hookform Resolvers** - Integration between React Hook Form and Zod

### Development Environment
- **Replit integration** - Cloud development environment support with custom plugins
- **Development middleware** - Hot module replacement and error reporting
- **TypeScript configuration** - Shared types between client and server