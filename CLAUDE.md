# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnipLink is a Chrome extension that removes tracking parameters from URLs to create clean, shareable links. It's built with TypeScript and uses Chrome Extension Manifest V3.

## Development Commands

```bash
# Build TypeScript files
pnpm build

# Watch mode for development
pnpm watch

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Run lint and format with auto-fix
pnpm check

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Package extension as zip file
pnpm package
```

## Architecture

### Core Components

1. **Background Service Worker** (`src/background.ts`):
   - Handles context menu creation and clicks
   - Creates offscreen documents for clipboard operations
   - Shows notifications for user feedback

2. **Popup** (`src/popup.ts`):
   - Main UI when extension icon is clicked
   - Shows original/cleaned URLs
   - Lists removed parameters
   - Allows manual URL editing
   - Direct clipboard copying via navigator API

3. **Shared Logic** (`src/shared.ts`):
   - `cleanUrl()`: Core URL cleaning function
   - `getTrackingParams()`: Retrieves tracking parameters from storage
   - Special handling for Amazon URLs (extracts ASIN, supports affiliate tags)
   - Domain whitelisting support

4. **Options Page** (`src/options.ts`):
   - User settings management
   - Custom tracking parameter configuration
   - Domain whitelist management
   - Amazon Associate ID settings

5. **Offscreen Document** (`src/offscreen.ts`):
   - Required for clipboard operations in service workers
   - Handles clipboard write messages from background script

### Key Features

- **URL Parameter Removal**: Removes common tracking parameters (utm_*, fbclid, gclid, etc.)
- **Amazon URL Simplification**: Extracts product ASIN and creates minimal URLs
- **Domain Whitelisting**: Skip cleaning for specific domains
- **Custom Parameters**: Users can add their own tracking parameters to remove
- **Multiple Access Methods**:
  - Popup interface
  - Context menu on links/pages

### Testing

Tests are written with Vitest and located in `src/test/`. The setup file mocks Chrome APIs for testing extension functionality.

### Build Configuration

- **TypeScript**: Compiles to ES2015 modules, outputs to same directory as source
- **Biome**: Used for linting and formatting (2-space indentation, double quotes, trailing commas)
- **Package Manager**: Uses pnpm with lockfile version 10.10.0