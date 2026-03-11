

## Plan: Add role filter to bulk WhatsApp dialog

### Change: `src/pages/app/Users.tsx`

**1. Add role filter state**

Add `bulkWhatsappRoleFilter` state (string, default `''` meaning "all roles"). Reset it when opening the dialog.

**2. Update filtering logic**

Extend `filteredUsersWithPhone` to also filter by role when `bulkWhatsappRoleFilter` is set. Check if `user.roles.includes(bulkWhatsappRoleFilter)`.

**3. Add role filter Select in the dialog UI**

Insert a `Select` dropdown between the search input and the recipients list (or next to the search input) with options: "Todos los roles", "Supervisor", "Acreditador", "Administración", "Superadmin". Use the existing `useRoles` hook or hardcode the four known roles matching the `roleConfig` pattern used elsewhere.

**4. Update toggle all**

The existing toggle-all logic already operates on `filteredUsersWithPhone`, so it will automatically respect the role filter.

### Files changed
- `src/pages/app/Users.tsx`

