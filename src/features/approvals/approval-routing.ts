import { departments, employees, regions } from '@/mocks/hrm-data'

export function getApprovalRoute(requesterId: string) {
  const requester = employees.find((employee) => employee.id === requesterId)
  const department = departments.find((item) => item.id === requester?.departmentId)
  const region = regions.find((item) => item.id === department?.regionId)

  return {
    leaderId: department?.leaderId ?? 'emp-001',
    seniorManagerId: region?.seniorManagerId ?? 'emp-001',
    ceoId: 'emp-001',
  }
}
