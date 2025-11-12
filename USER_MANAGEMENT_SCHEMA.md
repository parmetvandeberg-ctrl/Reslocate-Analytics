# User Management Schema - Reslocate Analytics

## Overview

The user management system in Reslocate Analytics is built on Supabase with a comprehensive schema supporting multiple user roles, educational profiles, and analytics tracking.

## Database Tables

### 1. Profiles Table

The core user profile table containing user information and educational data.

**Primary Table: `profiles`**

| Column                   | Type        | Nullable | Description                                      |
| ------------------------ | ----------- | -------- | ------------------------------------------------ |
| `id`                     | UUID        | NOT NULL | Primary key (references Supabase auth.users)     |
| `user_id`                | UUID        | NOT NULL | Foreign key to auth users table                  |
| `email`                  | VARCHAR     | NULLABLE | User email address                               |
| `first_name`             | VARCHAR     | NULLABLE | User's first name                                |
| `last_name`              | VARCHAR     | NULLABLE | User's last name                                 |
| `phone_number`           | VARCHAR     | NULLABLE | Contact phone number                             |
| `role`                   | ENUM        | NOT NULL | User role: 'Learner', 'Parent', 'Tutor', 'Other' |
| `school`                 | VARCHAR     | NULLABLE | Educational institution                          |
| `grade`                  | VARCHAR     | NULLABLE | Current grade level                              |
| `date_of_birth`          | DATE        | NULLABLE | User's date of birth                             |
| `quintile`               | VARCHAR     | NULLABLE | Economic quintile classification                 |
| `is_verified`            | BOOLEAN     | NULLABLE | Account verification status                      |
| `profile_picture`        | VARCHAR     | NULLABLE | Profile image URL                                |
| `race`                   | VARCHAR     | NULLABLE | Race/Ethnicity                                   |
| `gender`                 | VARCHAR     | NULLABLE | Gender                                           |
| `province`               | VARCHAR     | NULLABLE | Geographic location                              |
| `streetaddress`          | VARCHAR     | NULLABLE | Physical address                                 |
| `country`                | VARCHAR     | NULLABLE | Country                                          |
| `status`                 | VARCHAR     | NULLABLE | Account status                                   |
| `is_parent`              | BOOLEAN     | NULLABLE | Parent account indicator                         |
| `education_level`        | VARCHAR     | NULLABLE | Educational attainment                           |
| `employment_status`      | VARCHAR     | NULLABLE | Current employment status                        |
| `industry`               | VARCHAR     | NULLABLE | Industry/Field of work                           |
| `streetaddress`          | VARCHAR     | NULLABLE | Physical street address                          |
| `last_seen`              | TIMESTAMPTZ | NULLABLE | Last active timestamp                            |
| `career_quest_completed` | BOOLEAN     | NULLABLE | Career assessment completion status              |
| `learner_emails`         | VARCHAR     | NULLABLE | Associated learner emails (for parents)          |
| `created_at`             | TIMESTAMPTZ | NULLABLE | Record creation timestamp                        |
| `updated_at`             | TIMESTAMPTZ | NULLABLE | Record update timestamp                          |

**Careers and Aspirations Data:**

- `career_asp1`, `career_asp2`, `career_asp3` - Career aspirations
- `acad_chal1`, `acad_chal2`, `acad_chal3` - Academic challenges
- `learning_method1`, `learning_method2`, `learning_method3` - Learning methods
- `hobby1`, `hobby2`, `hobby3` - Personal hobbies
- `nearby_amenity` - Nearby educational amenities
- `safety` - Safety considerations
- `important_feature` - Important career features
- `commute` - Commute preferences

**Parent Profile Fields:**

- `pfirst_name`, `plast_name` - Parent names
- `pphone_number` - Parent phone number
- `parent_id` - Linked parent account ID

### 2. Supabase Auth Users Abstract Layer

**Default Auth Table (Supabase managed): `auth.users`**

| Column               | Type        | Description                  |
| -------------------- | ----------- | ---------------------------- |
| `id`                 | UUID        | Authentication user ID       |
| `email`              | TEXT        | User email address           |
| `email_confirmed_at` | TIMESTAMPTZ | Email confirmation timestamp |
| `created_at`         | TIMESTAMPTZ | User creation timestamp      |

### 3. User Progress Tables

**a. Profile Subject Marks Table: `profile_subject_marks`**

| Column         | Type         | Nullable | Description             |
| -------------- | ------------ | -------- | ----------------------- |
| `id`           | SERIAL       | NOT NULL | Primary key             |
| `profile_id`   | UUID         | NOT NULL | Foreign key to profiles |
| `subject_code` | VARCHAR      | NOT NULL | Subject identifier      |
| `percentage`   | DECIMAL(5,2) | NOT NULL | Mark percentage (0-100) |
| `created_at`   | TIMESTAMPTZ  | NULLABLE | Record creation         |
| `updated_at`   | TIMESTAMPTZ  | NULLABLE | Record update           |

**b. Subjects Reference Table: `subjects`**

| Column         | Type    | Nullable | Description       |
| -------------- | ------- | -------- | ----------------- |
| `subject_code` | VARCHAR | NOT NULL | Primary key       |
| `name`         | VARCHAR | NOT NULL | Subject name      |
| `level`        | VARCHAR | NULLABLE | Educational level |

### 4. Analytics Tables

**a. Sessions Table: `sessions`**

| Column       | Type        | Nullable | Description                                      |
| ------------ | ----------- | -------- | ------------------------------------------------ |
| `session_id` | UUID        | NOT NULL | Primary key (generated)                          |
| `user_id`    | UUID        | NOT NULL | Foreign key to profiles                          |
| `start_time` | TIMESTAMPTZ | NOT NULL | Session start                                    |
| `end_time`   | TIMESTAMPTZ | NULLABLE | Session end                                      |
| `status`     | ENUM        | NULLABLE | 'active', 'completed', 'disconnected', 'crashed' |
| `created_at` | TIMESTAMPTZ | NULLABLE | Record creation                                  |
| `updated_at` | TIMESTAMPTZ | NULLABLE | Record update                                    |

**b. AddedEmail Table: `AddedEmail`**

| Column       | Type        | Nullable | Description        |
| ------------ | ----------- | -------- | ------------------ |
| `id`         | SERIAL      | NOT NULL | Primary key        |
| `email`      | VARCHAR     | NOT NULL | Added email        |
| `first_name` | VARCHAR     | NULLABLE | Contact first name |
| `last_name`  | VARCHAR     | NULLABLE | Contact last name  |
| `created_by` | UUID        | NULLABLE | Creator user ID    |
| `created_at` | TIMESTAMPTZ | NULLABLE | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NULLABLE | Update timestamp   |

### 5. Download Analytics Tables

Various download statistics tables support analytics data.

## User Roles and Permissions

### Supported User Roles

1. **Learner** - Primary students using the platform
2. **Parent** - Parents/guardians monitoring learners
3. **Tutor** - Educational support providers
4. **Other** - General users

### Access Levels

- **Platform Access**: All roles can access general features
- **Role-Specific Views**: Custom interfaces per user role
- **Admin Functions**: Limited staff/admin functionality

## Managed Services

### Service: UserService

Located in: [`src/lib/userService.ts`](src/lib/userService.ts)

Provides user creation and management capabilities:

```typescript
// User Creation
createUserWithEmail(email, password, profileData);
createUserWithAdminAccess();
getRecentUsers();
generatePassword();

// Profile Management
getUserProfile();
updateUserProfile(profileId, profileData);

// Utility Functions
copyToClipboard(text);
```

### Service: AuthContext

Located in: [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx)

Manages authentication state:

```typescript
signUp(email, password);
signIn(email, password);
signOut();
user; // Current user state
loading; // Auth state loading
```

### Hooks: UseProfile

Located in: [`src/hooks/useProfile.ts`](src/hooks/useProfile.ts)

Manages profile data operations:

```typescript
useProfile(); // Get/create user profile
useProfileMarks(); // Get subject marks
useUpsertMark(); // Upsert mark data
useDeleteMark(); // Remove marks
useProfileTotals(); // Get APS totals
useMatches(); // Get matched courses
```

## User Interface Components

### UserManagement Page

Located in: [`src/pages/UserManagement.tsx`](src/pages/UserManagement.tsx)

Features:

- User creation with automatic/custom passwords
- Profile management and editing
- Role assignment
- Recent user tracking
- Bulk permissions

## Data Types and Interfaces

### Profile Interface (Primitive Data)

```typescript
interface Profile {
  id: string;
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  // ... complete interface in database.ts
}
```

### Related Data Types

```typescript
interface ProfileSubjectMark {
  id: number;
  profile_id: string;
  subject_code: string;
  percentage: number;
}

interface ProfileTotals {
  total_marks: number;
  average_percentage: number;
  total_points: number;
  aps_score: number;
  qualified_facts: string[];
}
```

## Security Features

- Supabase Row Level Security (RLS) policies
- UUID-based authentication
- Secure password generation

1. Email validation and verification

- Admin role access controls
- Audit logging through `AddedEmail` table
- Session tracking and monitoring

## Analytics Integration

### Session Tracking

- Automatic session start/end tracking
- User engagement metrics
- Distinct user counting
- Time-based analytics (24h, 7d, 30d)

### User Journey

3. Complete user journey mapping from registration to engagement

- Profile completion tracking
- Career assessment progress
- Educational matching algorithm data
- Activity pattern analysis

This schema supports comprehensive educational user management with integrated analytics, role-based access controls, and a complete user journey tracking system.

## New Features: AddedEmail Table Integration

### Direct Email Management Interface

**Location**: [`src/pages/UserManagement.tsx`](src/pages/UserManagement.tsx) - New "Added Emails" Tab

Features:

- **Add Individual Emails**: Direct form to add emails to AddedEmail table without user creation
- **Bulk View**: Complete list of all tracked emails with searchable table
- **Tracking Integration**: Automatic integration when users are created
- **Email Deduplication**: Prevention of duplicate entries through unique indexing

### Enhanced Service Functions

Added functions in [`src/lib/userService.ts`](src/lib/userService.ts):

```typescript
// Add individual emails to AddedEmail table
addEmailToAddedEmail(email: string, firstName?: string, lastName?: string)

// Fetch all AddedEmail records
getAllAddedEmails()

// Support for AddedEmail type interface
interface AddedEmail {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}
```

### Database Integration Enhancements

**Migration File**: [`supabase/migrations/create_added_email_table.sql`](supabase/migrations/create_added_email_table.sql)

**Indexing**:

- `idx_added_email_email` for fast email lookup
- `idx_added_email_created_at` for time-based queries

**Automatic Triggers**: Updated_at timestamp maintenance

**Data Structure Constraints**: Optional FK relations and RLS policies for sensitive data protection

This integration enables comprehensive email tracking for campaigns, analytics, and user engagement strategies alongside existing user management workflows.
</date>
</control>
</shape-something-schema>
</structured-system-definition>
</dimension-model>
</time-event-domain>
</email-universe-classzone>
</user-management-expansion>
