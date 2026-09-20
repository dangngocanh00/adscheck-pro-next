import type { OpsTask, PeopleDocument } from '@/types/people-ops'

const vietnamDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' })
const vietnamDateTime = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export const getTodayInVietnam = (date = new Date()) => vietnamDate.format(date)
export const isTaskDueToday = (task: OpsTask, date = new Date()) => task.dueDate.slice(0, 10) === getTodayInVietnam(date)
export const formatTaskDue = (dueDate: string) => vietnamDateTime.format(new Date(dueDate)).replace(',', ' ·')

export function getTaskSla(task: OpsTask) {
  if (task.status === 'done') return 'Đã hoàn tất'
  const difference = new Date(task.dueDate).getTime() - Date.now()
  const absoluteHours = Math.max(1, Math.ceil(Math.abs(difference) / 3_600_000))
  if (difference < 0) return absoluteHours < 24 ? `Quá hạn ${absoluteHours} giờ` : `Quá hạn ${Math.ceil(absoluteHours / 24)} ngày`
  if (absoluteHours < 24) return `Còn ${absoluteHours} giờ`
  return `Còn ${Math.ceil(absoluteHours / 24)} ngày`
}

export function getSignatureProgress(document: PeopleDocument) {
  const total = Math.max(1, document.signers)
  const signed = Math.min(total, Math.max(0, document.signed))
  return { total, signed, percentage: Math.round(signed / total * 100) }
}
