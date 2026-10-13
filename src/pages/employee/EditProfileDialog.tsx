import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useHR } from '@/store/hr-store'
import { Field } from '@/components/common'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Employee } from '@/types'

const PHONE_RE = /^\+?[\d\s-]{7,20}$/

/** Employee self-service: only phone, address and emergency contact are editable (SRS 4.1). */
export function EditProfileDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const { updateSelfProfile } = useHR()
  const [phone, setPhone] = useState(employee.phone)
  const [address, setAddress] = useState(employee.address)
  const [ecName, setEcName] = useState(employee.emergency_contact.name)
  const [ecPhone, setEcPhone] = useState(employee.emergency_contact.phone)

  const errors = {
    phone: !phone.trim() ? 'Phone number is required.' : !PHONE_RE.test(phone.trim()) ? 'Enter a valid phone number.' : '',
    address: !address.trim() ? 'Address is required.' : '',
    ecName: ecPhone.trim() && !ecName.trim() ? 'Add a name for this contact.' : '',
    ecPhone: ecPhone.trim() && !PHONE_RE.test(ecPhone.trim()) ? 'Enter a valid phone number.' : ecName.trim() && !ecPhone.trim() ? 'Add a phone number for this contact.' : '',
  }
  const valid = !Object.values(errors).some(Boolean)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    try {
      updateSelfProfile(employee.id, {
        phone: phone.trim(),
        address: address.trim(),
        emergency_contact: { name: ecName.trim(), phone: ecPhone.trim() },
      })
      toast.success('Your contact details were updated.')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your changes.')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit contact details</DialogTitle>
            <DialogDescription>Other details can only be changed by HR.</DialogDescription>
          </DialogHeader>
          <Field label="Phone" htmlFor="phone" required error={errors.phone}>
            <Input id="phone" type="tel" value={phone} aria-invalid={!!errors.phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Present address" htmlFor="address" required error={errors.address}>
            <Textarea id="address" rows={2} value={address} aria-invalid={!!errors.address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Emergency contact name" htmlFor="ec-name" error={errors.ecName}>
              <Input id="ec-name" value={ecName} aria-invalid={!!errors.ecName} onChange={(e) => setEcName(e.target.value)} />
            </Field>
            <Field label="Emergency contact phone" htmlFor="ec-phone" error={errors.ecPhone}>
              <Input id="ec-phone" type="tel" value={ecPhone} aria-invalid={!!errors.ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!valid}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
