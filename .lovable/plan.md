

## Plan: Bulk WhatsApp button for pending contracts in Applicants dialog

### Change: `src/components/events/EventApplicantsDialog.tsx`

**1. Add state for confirmation dialog**
- `bulkFirmaPendienteConfirmOpen` (boolean)
- `sendingFirmaPendiente` (boolean)

**2. Compute pending contract applicants**
- Derive `pendingContractApplicants` from `applicants` array: filter where `application_status === 'aceptado'` and `contract_status === 'pendiente'`. Cross-reference with `profiles` to get only those with a valid phone number.

**3. Add button in the dialog header area (next to title or above filters)**
- Button label: `Firma Pendiente (N)` with `MessageSquare` icon, where N is the count of pending contract users with phone.
- Disabled when count is 0 or when sending.
- On click: opens `ConfirmDialog`.

**4. Confirmation dialog**
- Uses existing `ConfirmDialog` component.
- Message: "Se enviará la plantilla msg_firma_pendiente a N persona(s) con contrato pendiente. ¿Deseas continuar?"
- On confirm: loops through pending contract applicants, invokes `send-whatsapp-message` with `template_name: 'msg_firma_pendiente'`, `parameters: [nombre]`. Shows success/fail toast.

**5. New imports**
- `MessageSquare` from lucide-react
- `ConfirmDialog` from `@/components/ui/ConfirmDialog`

### Files changed
- `src/components/events/EventApplicantsDialog.tsx`

