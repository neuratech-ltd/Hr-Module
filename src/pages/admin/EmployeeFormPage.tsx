import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { addDays, differenceInYears, parseISO } from 'date-fns'
import { ArrowLeft, ImagePlus, Trash2, UserX } from 'lucide-react'
import { useHR } from '@/store/hr-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState, Field, NativeSelect, PageHeader, PersonAvatar } from '@/components/common'
import { employeeById, nextEmployeeId } from '@/lib/hr'
import { toISO, todayISO } from '@/lib/dates'
import type { EmployeeInput, EmploymentType, EmployeeStatus, Gender } from '@/types'
import { EMPLOYMENT_TYPE_LABEL, GENDER_LABEL } from '@/lib/labels'

interface FormState {
  full_name: string
  email: string
  phone: string
  gender: Gender | ''
  date_of_birth: string
  nid: string
  photo: string | null
  department: string
  designation: string
  joining_date: string
  employment_type: EmploymentType | ''
  status: EmployeeStatus
  address: string
  ec_name: string
  ec_phone: string
}

type Errors = Partial<Record<keyof FormState, string>>

const EMPTY: FormState = {
  full_name: '',
  email: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  nid: '',
  photo: null,
  department: '',
  designation: '',
  joining_date: todayISO(),
  employment_type: 'PERMANENT',
  status: 'ACTIVE',
  address: '',
  ec_name: '',
  ec_phone: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,16}[0-9]$/
const MAX_PHOTO = 2 * 1024 * 1024

function validate(f: FormState): Errors {
  const e: Errors = {}
  const today = todayISO()
  if (!f.full_name.trim()) e.full_name = 'Full name is required.'
  else if (f.full_name.trim().length < 3) e.full_name = 'Enter the full name (at least 3 characters).'
  if (!f.email.trim()) e.email = 'Email is required.'
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address.'
  if (!f.phone.trim()) e.phone = 'Phone number is required.'
  else if (!PHONE_RE.test(f.phone.trim())) e.phone = 'Enter a valid phone number, e.g. +8801711000000.'
  if (!f.gender) e.gender = 'Select a gender.'
  if (!f.date_of_birth) e.date_of_birth = 'Date of birth is required.'
  else if (f.date_of_birth >= today) e.date_of_birth = 'Date of birth must be in the past.'
  else if (differenceInYears(parseISO(today), parseISO(f.date_of_birth)) < 16)
    e.date_of_birth = 'Employee must be at least 16 years old.'
  if (f.nid.trim() && !/^\d{10,17}$/.test(f.nid.trim())) e.nid = 'NID should be 10 to 17 digits.'
  if (!f.department) e.department = 'Select a department.'
  if (!f.designation) e.designation = 'Select a designation.'
  if (!f.joining_date) e.joining_date = 'Joining date is required.'
  else if (f.joining_date > toISO(addDays(parseISO(today), 30)))
    e.joining_date = 'Joining date cannot be more than 30 days in the future.'
  else if (f.date_of_birth && f.joining_date <= f.date_of_birth) e.joining_date = 'Joining date must be after date of birth.'
  if (!f.employment_type) e.employment_type = 'Select an employment type.'
  if (!f.address.trim()) e.address = 'Present address is required.'
  if (f.ec_phone.trim() && !PHONE_RE.test(f.ec_phone.trim())) e.ec_phone = 'Enter a valid phone number.'
  if (f.ec_phone.trim() && !f.ec_name.trim()) e.ec_name = 'Add a name for this contact.'
  return e
}

/** Reads an image file and downscales it to fit within 256px, returned as a data URL. */
function downscale(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image could not be read.'))
    }
    img.src = url
  })
}

export function EmployeeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, createEmployee, updateEmployee } = useHR()
  const existing = id ? employeeById(data, Number(id)) : undefined
  const isEdit = !!id

  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          full_name: existing.full_name,
          email: existing.email,
          phone: existing.phone,
          gender: existing.gender,
          date_of_birth: existing.date_of_birth,
          nid: existing.nid,
          photo: existing.photo,
          department: String(existing.department),
          designation: String(existing.designation),
          joining_date: existing.joining_date,
          employment_type: existing.employment_type,
          status: existing.status,
          address: existing.address,
          ec_name: existing.emergency_contact.name,
          ec_phone: existing.emergency_contact.phone,
        }
      : EMPTY,
  )
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (isEdit && !existing) {
    return (
      <div>
        <PageHeader title="Edit employee" />
        <Card>
          <EmptyState icon={UserX} title="Employee not found" description="This employee does not exist or was removed." />
          <div className="flex justify-center pb-4">
            <Button variant="outline" render={<Link to="/admin/employees" />}>
              <ArrowLeft /> Back to employees
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const patch = (changes: Partial<FormState>) => {
    const next = { ...form, ...changes }
    setForm(next)
    if (submitted) setErrors((x) => ({ ...validate(next), photo: x.photo }))
  }
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => patch({ [key]: value })
  const text = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(key, e.target.value as never)

  const designations = data.designations.filter((d) => d.department === Number(form.department))

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors((x) => ({ ...x, photo: 'Use a JPG or PNG image.' }))
      return
    }
    if (file.size > MAX_PHOTO) {
      setErrors((x) => ({ ...x, photo: 'The photo must be 2 MB or smaller.' }))
      return
    }
    try {
      const url = await downscale(file)
      setForm((f) => ({ ...f, photo: url }))
      setErrors((x) => ({ ...x, photo: undefined }))
    } catch (err) {
      setErrors((x) => ({ ...x, photo: (err as Error).message }))
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields.')
      const first = Object.keys(errs)[0]
      document.getElementById(first)?.focus()
      return
    }
    const input: EmployeeInput = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      gender: form.gender as Gender,
      date_of_birth: form.date_of_birth,
      nid: form.nid.trim(),
      photo: form.photo,
      department: Number(form.department),
      designation: Number(form.designation),
      joining_date: form.joining_date,
      employment_type: form.employment_type as EmploymentType,
      status: form.status,
      address: form.address.trim(),
      emergency_contact: { name: form.ec_name.trim(), phone: form.ec_phone.trim() },
    }
    try {
      if (existing) {
        updateEmployee(existing.id, input)
        toast.success('Employee profile updated.')
        navigate(`/admin/employees/${existing.id}`)
      } else {
        const created = createEmployee(input)
        toast.success(`${created.full_name} added as ${created.employee_id}.`, {
          description: `A login account was created for ${created.email} with the default password "welcome123".`,
          duration: 8000,
        })
        navigate(`/admin/employees/${created.id}`)
      }
    } catch (err) {
      toast.error((err as Error).message)
      if (/email/i.test((err as Error).message)) setErrors((x) => ({ ...x, email: (err as Error).message }))
    }
  }

  const backTo = existing ? `/admin/employees/${existing.id}` : '/admin/employees'

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title={isEdit ? 'Edit employee' : 'Add employee'}
        description={
          isEdit
            ? `Update the profile of ${existing!.full_name} (${existing!.employee_id}).`
            : 'Create an employee profile. A login account is created automatically.'
        }
        actions={
          <Button variant="ghost" render={<Link to={backTo} />}>
            <ArrowLeft /> Back
          </Button>
        }
      />

      <div className="grid gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Basic information</CardTitle>
            <CardDescription>
              {isEdit ? (
                <>
                  Employee ID <span className="font-mono text-foreground">{existing!.employee_id}</span>
                </>
              ) : (
                <>
                  Will be assigned <span className="font-mono font-medium text-foreground">{nextEmployeeId(data)}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[10rem_1fr]">
            <div className="flex flex-row items-center gap-4 md:flex-col md:items-start">
              <PersonAvatar
                name={form.full_name || '?'}
                photo={form.photo}
                className="size-20 text-lg md:size-28 md:text-2xl"
              />
              <div className="grid gap-1.5">
                <input
                  ref={fileRef}
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={onPhoto}
                />
                <div className="flex gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <ImagePlus /> {form.photo ? 'Change' : 'Upload photo'}
                  </Button>
                  {form.photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove photo"
                      onClick={() => set('photo', null)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
                {errors.photo ? (
                  <p className="text-xs text-destructive">{errors.photo}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">JPG or PNG, up to 2 MB</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="full_name" required error={errors.full_name} className="sm:col-span-2">
                <Input id="full_name" value={form.full_name} onChange={text('full_name')} aria-invalid={!!errors.full_name} autoComplete="off" />
              </Field>
              <Field label="Email" htmlFor="email" required error={errors.email} hint={isEdit ? undefined : 'Used to sign in.'}>
                <Input id="email" type="email" value={form.email} onChange={text('email')} aria-invalid={!!errors.email} placeholder="name@company.com" />
              </Field>
              <Field label="Phone" htmlFor="phone" required error={errors.phone}>
                <Input id="phone" type="tel" value={form.phone} onChange={text('phone')} aria-invalid={!!errors.phone} placeholder="+8801711000000" />
              </Field>
              <Field label="Gender" htmlFor="gender" required error={errors.gender}>
                <NativeSelect id="gender" value={form.gender} onChange={text('gender')} aria-invalid={!!errors.gender}>
                  <option value="" disabled>
                    Select gender
                  </option>
                  {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                    <option key={g} value={g}>
                      {GENDER_LABEL[g]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Date of birth" htmlFor="date_of_birth" required error={errors.date_of_birth}>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  max={todayISO()}
                  onChange={text('date_of_birth')}
                  aria-invalid={!!errors.date_of_birth}
                />
              </Field>
              <Field label="National ID (NID)" htmlFor="nid" error={errors.nid} hint="Optional" className="sm:col-span-2">
                <Input id="nid" inputMode="numeric" value={form.nid} onChange={text('nid')} aria-invalid={!!errors.nid} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Job details</CardTitle>
            <CardDescription>Role, department and employment terms.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" htmlFor="department" required error={errors.department}>
              <NativeSelect
                id="department"
                value={form.department}
                onChange={(e) => patch({ department: e.target.value, designation: '' })}
                aria-invalid={!!errors.department}
              >
                <option value="" disabled>
                  Select department
                </option>
                {data.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label="Designation"
              htmlFor="designation"
              required
              error={errors.designation}
              hint={form.department && designations.length === 0 ? 'No designations in this department yet.' : undefined}
            >
              <NativeSelect
                id="designation"
                value={form.designation}
                onChange={text('designation')}
                disabled={!form.department}
                aria-invalid={!!errors.designation}
              >
                <option value="" disabled>
                  {form.department ? 'Select designation' : 'Select a department first'}
                </option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Joining date" htmlFor="joining_date" required error={errors.joining_date}>
              <Input
                id="joining_date"
                type="date"
                value={form.joining_date}
                max={toISO(addDays(new Date(), 30))}
                onChange={text('joining_date')}
                aria-invalid={!!errors.joining_date}
              />
            </Field>
            <Field label="Employment type" htmlFor="employment_type" required error={errors.employment_type}>
              <NativeSelect
                id="employment_type"
                value={form.employment_type}
                onChange={text('employment_type')}
                aria-invalid={!!errors.employment_type}
              >
                {(Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map((t) => (
                  <option key={t} value={t}>
                    {EMPLOYMENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label="Status"
              htmlFor="status"
              required
              hint={form.status === 'INACTIVE' ? 'Inactive employees cannot sign in.' : undefined}
            >
              <NativeSelect id="status" value={form.status} onChange={text('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Contact</CardTitle>
            <CardDescription>Address and who to call in an emergency.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Present address" htmlFor="address" required error={errors.address} className="sm:col-span-2">
              <Textarea id="address" rows={3} value={form.address} onChange={text('address')} aria-invalid={!!errors.address} />
            </Field>
            <Field label="Emergency contact name" htmlFor="ec_name" error={errors.ec_name} hint="Optional">
              <Input id="ec_name" value={form.ec_name} onChange={text('ec_name')} aria-invalid={!!errors.ec_name} />
            </Field>
            <Field label="Emergency contact phone" htmlFor="ec_phone" error={errors.ec_phone} hint="Optional">
              <Input id="ec_phone" type="tel" value={form.ec_phone} onChange={text('ec_phone')} aria-invalid={!!errors.ec_phone} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-2 border-t bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
          Fields marked <span className="text-destructive">*</span> are required.
        </p>
        <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? 'Save changes' : 'Create employee'}</Button>
      </div>
    </form>
  )
}
