

## Problem

When the password reset email is sent, the link redirects to `/auth/reset-password`, but that route doesn't exist in `App.tsx` — hence the 404.

Additionally, the `redirectTo` in `AuthContext.tsx` uses `window.location.origin`, which works on Vercel (`https://cpdata-acreditador.vercel.app`), but the route itself is missing.

## Solution

Two changes:

**1. Create `src/pages/auth/ResetPassword.tsx`**
- Form with "new password" and "confirm password" fields
- Uses `supabase.auth.updateUser({ password })` to set the new password
- Uses `AuthLayout` for consistent look
- Redirects to `/auth/login` on success

**2. Add route in `src/App.tsx`**
- Add `/auth/reset-password` route (public, no `PublicRoute` wrapper since the user arrives from an email link with a recovery token)

