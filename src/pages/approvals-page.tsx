import { LockKeyhole } from 'lucide-react'
import { EmployeeRequestHub } from '@/features/approvals/employee-request-hub'
import { ManagerApprovalCockpit } from '@/features/approvals/manager-approval-cockpit'
import { canApproveRequests, useAppStore } from '@/store/app-store'

export default function ApprovalsPage() {
  const role = useAppStore((state) => state.role)
  if (canApproveRequests(role)) return <ManagerApprovalCockpit key={role} />
  if (role === 'staff') return <EmployeeRequestHub />
  return <section className="surface permission-state"><div><LockKeyhole size={28}/></div><h1>Không có quyền truy cập đơn từ</h1><p>Vai trò hiện tại không thuộc luồng phê duyệt và không có hồ sơ đơn cá nhân.</p></section>
}
