

## Plan: Fix event team role assignment

### Problem
The `event_accreditors` table stores no information about which role (supervisor or acreditador) a person was assigned as. When reopening the dialog, the code guesses by checking if the user_id appears in the supervisor or accreditor role lists. If a user has both roles, or if another user is only an acreditador, the pre-selection logic can misplace them.

### Solution
Add a `role` column to the `event_accreditors` table to persist the assignment role.

### Changes

**1. Database migration**
- Add column `assigned_role text` to `event_accreditors` with default `'acreditador'`
- Update existing rows: set `assigned_role = 'supervisor'` where `user_id` is in the `user_roles` table with role `supervisor`

**2. `src/components/events/EventTeamDialog.tsx`**
- **Save**: include `assigned_role: 'supervisor'` or `assigned_role: 'acreditador'` in each inserted row based on which map the user came from
- **Load**: fetch `assigned_role` alongside `user_id` and `shift` in existing assignments query, and use it to populate the correct map (`supMap` vs `accMap`) instead of guessing from the user's roles

### Result
- Each assignment remembers whether the person was added as supervisor or acreditador
- Re-opening the dialog will show each person in the correct tab

