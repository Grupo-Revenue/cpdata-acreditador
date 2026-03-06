

## Problem

When clicking the recovery link from the email, the user sees "acceso denegado" (access denied). The auth logs confirm:
1. First `/verify` call succeeds (token processed, session created, 303 redirect)
2. Second `/verify` call fails: "One-time token not found" / "Email link is invalid or has expired"

There are two issues:

### Issue 1: Redirect URLs not configured in Supabase
The `redirectTo` in the recovery email uses `window.location.origin`, but Supabase only allows redirects to URLs listed in the **Redirect URLs** setting in the dashboard. If the Vercel URL (`https://cpdata-acreditador.vercel.app`) and the Lovable preview URL are not listed, Supabase blocks the redirect with "access denied."

**Fix**: The user needs to add their allowed URLs in the Supabase dashboard under **Authentication > URL Configuration > Redirect URLs**:
- `https://cpdata-acreditador.vercel.app/**`
- `https://id-preview--40d3fa8d-3023-41c0-95c7-35bd26852e37.lovable.app/**`

### Issue 2: AuthContext interferes with recovery flow
When the recovery session is established, `onAuthStateChange` fires and if the user is approved+active, `PublicRoute` or other logic could redirect them away from `/auth/reset-password`. The `PASSWORD_RECOVERY` event should be handled explicitly.

**Fix in `src/contexts/AuthContext.tsx`**:
- Detect the `PASSWORD_RECOVERY` event in `onAuthStateChange`
- Store a flag (e.g., `isRecoveryMode`) so the app knows not to redirect
- Navigate to `/auth/reset-password` when recovery event is detected

**Fix in `src/pages/auth/ResetPassword.tsx`**:
- Add a `useEffect` that listens for the `PASSWORD_RECOVERY` auth event to confirm the session is ready before allowing form submission
- Show a loading/error state if the session isn't valid (expired link scenario)

### Files Changed
- `src/contexts/AuthContext.tsx` — handle `PASSWORD_RECOVERY` event
- `src/pages/auth/ResetPassword.tsx` — add session readiness check

### Manual Step (User Action Required)
Add redirect URLs in Supabase dashboard: **Authentication > URL Configuration > Redirect URLs**

