UPDATE role_permissions SET enabled = false
WHERE role IN ('supervisor', 'acreditador')
AND permission_key IN (
  'nav.users',
  'action.events.edit',
  'action.events.team',
  'action.events.contract',
  'action.invoices.edit',
  'action.invoices.whatsapp',
  'action.support.edit'
);