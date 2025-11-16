# GitHub Copilot Instructions for DAMII: Wellness Navigator

## Project Overview

DAMII is a wellness and mental health support application built with Next.js, TypeScript, and Firebase. The app uses AI (Genkit with Gemini API) to provide personalized wellness guidance, emotional support, and activity tracking.

## Tech Stack

- **Framework**: Next.js 15.3.3 with TypeScript
- **Authentication & Database**: Firebase Authentication + Firestore
- **AI Integration**: Genkit AI with Google Genai (@genkit-ai/google-genai)
- **Styling**: Tailwind CSS with Radix UI components
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and Firebase hooks

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── actions.ts    # Server actions for AI interactions
│   ├── dashboard/    # Main dashboard UI
│   ├── login/        # Authentication pages
│   └── signup/
├── components/       # Reusable React components (Radix UI based)
├── firebase/         # Firebase configuration and utilities
├── ai/              # Genkit AI configuration
├── hooks/           # Custom React hooks
└── lib/             # Utility functions
```

## Code Style & Conventions

### TypeScript

- Use strict TypeScript with proper type annotations
- Prefer interfaces over types for object definitions
- Use Zod schemas for runtime validation
- Enable all strict compiler options

### React Components

- Use functional components with hooks
- Prefer `'use client'` directive for client components when needed
- Use proper React 18+ patterns (e.g., Suspense, error boundaries)
- Component file naming: PascalCase (e.g., `ActivityLogger.tsx`)

### Firebase Integration

- Always use the custom hooks: `useFirestore()`, `useUser()`, `useAuth()`
- Import database functions from `@/firebase/user-actions`
- Follow the existing Firestore data structure (see DATABASE_GUIDE.md)
- User data structure:
  ```
  /users/{userId}/moodLogs/{logId}
  /users/{userId}/chatHistory/{messageId}
  ```

### AI/Genkit Usage

- AI flows are in `src/ai/` directory
- Server actions for AI calls are in `src/app/actions.ts`
- Always use proper error handling for AI responses
- Include context from chat history when relevant

### Styling

- Use Tailwind CSS utility classes
- Follow the color scheme:
  - Primary: Soft lavender (#D1B0FF)
  - Background: Light gray (#F5F5F5)
  - Accent: Muted teal (#73C2FB)
- Typography:
  - Body: 'Inter' sans-serif
  - Headlines: 'Space Grotesk' sans-serif
- Use Radix UI components for complex UI elements (dialogs, dropdowns, etc.)
- Maintain clean, intuitive layouts with subtle animations

## Important Patterns

### Authentication Flow

```typescript
import { useUser, useAuth } from '@/firebase';

const { user, loading } = useUser();
const auth = useAuth();
```

### Database Operations

```typescript
import { useFirestore } from '@/firebase';
import { saveMoodLog, getMoodLogs } from '@/firebase/user-actions';

const firestore = useFirestore();
await saveMoodLog(firestore, userId, moodData);
```

### Form Handling

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({...});
const form = useForm({
  resolver: zodResolver(schema),
});
```

## Security Considerations

- Never expose Firebase API keys in client code (use environment variables)
- Firestore security rules enforce user data isolation
- Users can only access their own data (`/users/{userId}`)
- Always validate user authentication before database operations
- Use Zod schemas to validate all user inputs

## Development Commands

```bash
npm run dev          # Start development server (port 9002)
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
npm run genkit:dev   # Start Genkit development server
```

## Testing & Validation

- Run `npm run typecheck` before committing
- Run `npm run lint` to check code style
- Test authentication flows manually
- Verify Firebase data in the Firebase Console
- Test AI responses for appropriate tone and content

## Common Pitfalls to Avoid

1. **Don't fetch user data without authentication check**
   ```typescript
   // ❌ Wrong
   const data = await getMoodLogs(firestore, userId);
   
   // ✅ Correct
   if (!user) return;
   const data = await getMoodLogs(firestore, user.uid);
   ```

2. **Don't use client-side API calls for sensitive operations**
   - Use Next.js Server Actions for AI calls and sensitive logic

3. **Don't hardcode user IDs or Firebase config**
   - Always use `user.uid` from authentication
   - Use environment variables for config

4. **Don't ignore TypeScript errors**
   - Fix type errors rather than using `@ts-ignore`
   - Use proper type guards and narrowing

5. **Don't skip form validation**
   - Always validate with Zod schemas
   - Show appropriate error messages to users

## Documentation References

- See `DATABASE_GUIDE.md` for detailed Firestore usage
- See `docs/blueprint.md` for app vision and style guidelines
- Firebase project: `studio-1760621235-adf38`

## AI Tone & Content Guidelines

When working with AI responses:
- Maintain empathetic and supportive tone
- Provide evidence-based wellness suggestions
- Focus on hydration, sleep, exercise, and nutrition
- Include validation and coping strategies for emotional support
- Keep responses clear and actionable

## Contributing

- Make minimal, focused changes
- Follow existing code patterns
- Update documentation when changing features
- Test thoroughly before submitting PRs
- Keep components modular and reusable
