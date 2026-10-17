import { useRef, useState, type ReactNode } from 'react'
import { Briefcase, Camera, Pencil, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth'
import { useHR } from '@/store/hr-store'
import { EmployeeStatusBadge, PageHeader, PersonAvatar } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { departmentName, designationTitle } from '@/lib/hr'
import { fmtDate } from '@/lib/dates'
import type { Employee } from '@/types'
import { EditProfileDialog } from './EditProfileDialog'
import { bloodGroupLabel } from '@/lib/labels'

const MAX_PHOTO_BYTES = 2 * 1024 * 1024

const title = (s: string) => s[0] + s.slice(1).toLowerCase()

/** Reads an image file and returns a JPEG/PNG data URL no larger than `max` px on its longest side. */
function downscale(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Could not process the image.'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This file could not be read as an image.'))
    }
    img.src = url
  })
}

export function MyProfilePage() {
  const { employee } = useAuth()
  if (!employee) return null
  return <MyProfile employee={employee} />
}

function MyProfile({ employee }: { employee: Employee }) {
  const { data, updatePhoto } = useHR()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)

  async function onPhoto(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return toast.error('Please choose a JPG or PNG image.')
    if (file.size > MAX_PHOTO_BYTES) return toast.error('The photo must be 2 MB or smaller.')
    try {
      updatePhoto(employee.id, await downscale(file))
      toast.success('Profile photo updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the photo.')
    }
  }

  function removePhoto() {
    updatePhoto(employee.id, null)
    toast.success('Profile photo removed.')
  }

  const dept = departmentName(data, employee.department)
  const desig = designationTitle(data, employee.designation)

  return (
    <>
      <PageHeader
        title="My profile"
        description="Your personal and job information on record."
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil />
            Edit contact details
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative self-start">
              <PersonAvatar name={employee.full_name} photo={employee.photo} className="size-20 text-xl sm:size-24 sm:text-2xl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label="Change profile photo"
              >
                <Camera className="size-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  void onPhoto(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-semibold tracking-tight">{employee.full_name}</h2>
                <EmployeeStatusBadge status={employee.status} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {desig} · {dept}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  ID <span className="font-medium text-foreground">{employee.employee_id}</span>
                </span>
                <span>
                  Joined <span className="font-medium text-foreground">{fmtDate(employee.joining_date)}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2 sm:flex-col sm:items-end">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera />
                {employee.photo ? 'Change photo' : 'Upload photo'}
              </Button>
              {employee.photo && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={removePhoto}>
                  <Trash2 />
                  Remove
                </Button>
              )}
              <p className="hidden text-[11px] text-muted-foreground sm:block">JPG or PNG, up to 2 MB</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section icon={UserRound} title="Personal details">
            <Item label="Full name">{employee.full_name}</Item>
            <Item label="Email">{employee.email}</Item>
            <Item label="Phone">{employee.phone}</Item>
            <Item label="Gender">{title(employee.gender)}</Item>
            <Item label="Date of birth">{fmtDate(employee.date_of_birth)}</Item>
            <Item label="National ID">{employee.nid}</Item>
            <Item label="Blood group">{bloodGroupLabel(employee.blood_group)}</Item>
            <Item label="Address" wide>
              {employee.address}
            </Item>
            <Item label="Emergency contact" wide>
              {employee.emergency_contact.name ? (
                <>
                  {employee.emergency_contact.name}
                  {employee.emergency_contact.phone && (
                    <span className="text-muted-foreground"> · {employee.emergency_contact.phone}</span>
                  )}
                </>
              ) : null}
            </Item>
          </Section>

          <Section icon={Briefcase} title="Job details">
            <Item label="Employee ID">{employee.employee_id}</Item>
            <Item label="Status">
              <EmployeeStatusBadge status={employee.status} />
            </Item>
            <Item label="Department">{dept}</Item>
            <Item label="Designation">{desig}</Item>
            <Item label="Joining date">{fmtDate(employee.joining_date)}</Item>
            <Item label="Employment type">{title(employee.employment_type)}</Item>
          </Section>
        </div>
      </div>

      {editing && <EditProfileDialog employee={employee} onClose={() => setEditing(false)} />}
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: ReactNode }) {
  return (
    <Card className="self-start">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  )
}

function Item({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  const empty = children === null || children === undefined || children === ''
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{empty ? <span className="text-muted-foreground">Not provided</span> : children}</dd>
    </div>
  )
}
