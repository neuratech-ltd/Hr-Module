import type { EmploymentType, Gender } from '@/types'

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
}

export const GENDER_LABEL: Record<Gender, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }
