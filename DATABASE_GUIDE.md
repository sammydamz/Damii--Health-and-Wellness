# Firebase Firestore Database Guide

## Overview
Your app uses Firebase Firestore as the database. All data is automatically saved to the cloud and synced across devices.

## Database Structure

```
/users/{userId}
  ├── id: string
  ├── email: string
  ├── username: string
  ├── registrationDate: string
  ├── /moodLogs/{logId}
  │   ├── mood: number (1-5)
  │   ├── activities: string[]
  │   ├── date: string (YYYY-MM-DD)
  │   ├── notes?: string
  │   └── timestamp: Timestamp
  └── /chatHistory/{messageId}
      ├── role: 'user' | 'assistant'
      ├── content: string
      └── timestamp: Timestamp
```

## Available Functions

### User Profile

#### `createUserProfile(firestore, user, additionalData)`
Creates or updates a user profile.
```typescript
await createUserProfile(firestore, user, {
  username: 'JohnDoe'
});
```

#### `getUserProfile(firestore, userId)`
Retrieves a user's profile.
```typescript
const profile = await getUserProfile(firestore, user.uid);
console.log(profile.username);
```

#### `updateUserProfile(firestore, userId, updates)`
Updates user profile fields.
```typescript
await updateUserProfile(firestore, user.uid, {
  username: 'NewUsername',
  interests: ['meditation', 'exercise'],
  goals: ['sleep better', 'reduce stress']
});
```

### Mood Logs

#### `saveMoodLog(firestore, userId, moodData)`
Saves a daily mood and activity log.
```typescript
await saveMoodLog(firestore, user.uid, {
  mood: 4, // 1-5 scale
  activities: ['hydration', 'exercise', 'meditation'],
  date: '2025-11-16',
  notes: 'Felt great today!'
});
```

#### `getMoodLogs(firestore, userId, startDate?, endDate?, limit?)`
Retrieves mood logs within a date range.
```typescript
// Get last 30 logs
const logs = await getMoodLogs(firestore, user.uid);

// Get logs for specific date range
const logs = await getMoodLogs(
  firestore, 
  user.uid,
  '2025-11-01',
  '2025-11-30'
);
```

### Chat History

#### `saveChatMessage(firestore, userId, message)`
Saves a chat message.
```typescript
await saveChatMessage(firestore, user.uid, {
  role: 'user',
  content: 'How can I improve my sleep?'
});
```

#### `getChatHistory(firestore, userId, limit?)`
Retrieves chat history.
```typescript
const messages = await getChatHistory(firestore, user.uid, 50);
```

## Usage Example in Components

```typescript
'use client';

import { useFirestore, useUser } from '@/firebase';
import { saveMoodLog, getMoodLogs } from '@/firebase/user-actions';
import { useEffect, useState } from 'react';

export function MyComponent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [logs, setLogs] = useState([]);

  // Load logs on mount
  useEffect(() => {
    if (user) {
      getMoodLogs(firestore, user.uid, undefined, undefined, 30)
        .then(setLogs)
        .catch(console.error);
    }
  }, [user, firestore]);

  // Save a new log
  const handleSave = async () => {
    if (!user) return;
    
    await saveMoodLog(firestore, user.uid, {
      mood: 5,
      activities: ['exercise', 'meditation'],
      date: new Date().toISOString().split('T')[0]
    });
    
    // Reload logs
    const updated = await getMoodLogs(firestore, user.uid);
    setLogs(updated);
  };

  return (
    <div>
      <button onClick={handleSave}>Save Log</button>
      {logs.map(log => (
        <div key={log.id}>
          Mood: {log.mood}, Date: {log.date}
        </div>
      ))}
    </div>
  );
}
```

## Security Rules

The database has strict security rules:
- ✅ Users can only read/write their own data
- ✅ User IDs must match authenticated user
- ❌ Listing all users is not allowed
- ❌ Users cannot access other users' data

## Viewing Data in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `studio-1760621235-adf38`
3. Click **Firestore Database** in the left menu
4. Browse through collections:
   - `users` → See all user profiles
   - Click a user → `moodLogs` → See their mood logs
   - Click a user → `chatHistory` → See their chat history

## Testing Data Storage

The `ActivityLogger` component is already integrated! When you:
1. Log in to the dashboard
2. Select a mood and activities
3. Click "Save Log"

→ Data is automatically saved to Firestore under `/users/{yourUserId}/moodLogs/`

Check the Firebase Console to see your data appear in real-time!

## Next Steps

You can extend this by:
1. Adding more collections (goals, habits, journal entries)
2. Creating analytics dashboards
3. Adding data export features
4. Implementing data backup/restore

All the connection and authentication is already done - just use the provided functions! 🎉
