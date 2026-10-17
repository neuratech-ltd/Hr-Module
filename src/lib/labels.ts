import type { BloodGroup, EmploymentType, Gender } from '@/types'

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
}

export const GENDER_LABEL: Record<Gender, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/** Display text for a blood group; older profiles may not have one. */
export const bloodGroupLabel = (g: BloodGroup | '' | undefined) => g || ''
