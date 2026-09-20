import {
  Bolt, Building2, CircleX, CreditCard, Edit, Eye, FileText, Folder, Globe,
  Image as ImageIcon, Link as LinkIcon, LogIn, LogOut, Mail, Megaphone,
  MessageCircle, Minus, Pencil, Plus, Receipt, RefreshCw, Send, Settings,
  Share2, Shield, ShieldCheck, Star, Trash, Trash2, Unlink, Upload, User,
  Users, XCircle, Circle, type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import {
  AccountAppealSupportGroupIcon, AdsCheckProGroupIcon, AdsManagementGroupIcon,
  ChangeAccountInfoGroupIcon, PaymentBillingGroupIcon, RemoveHiddenAdminGroupIcon,
  SuperShareGroupIcon,
} from './ads-check-pro-group-icons'
import type { AdsFunctionGroupId } from './ads-check-pro-workspace-data'

// Group header icon — EXACT production gradient badge assets, extracted
// from references/remotes/adaccounts/436.e5c83aa9.js's embedded base64 SVGs
// (one per canonical groupId, "share-pixel" reuses the same asset as
// "super-share" in production itself). "unclassified" has no production
// asset evidence (fallback bucket, likely never populated in the recovered
// catalog) — kept as a plain Lucide icon, tier C.
export const groupIcons: Record<AdsFunctionGroupId, ComponentType<{ size?: number }>> = {
  'ads-check-pro': AdsCheckProGroupIcon,
  'super-share': SuperShareGroupIcon,
  'remove-hidden-admin': RemoveHiddenAdminGroupIcon,
  'change-account-info': ChangeAccountInfoGroupIcon,
  'share-pixel': SuperShareGroupIcon,
  'payment-billing': PaymentBillingGroupIcon,
  'ads-management': AdsManagementGroupIcon,
  'account-appeal-support': AccountAppealSupportGroupIcon,
  unclassified: Circle,
}

// Function icon — keyed by the STABLE lucide icon name carried on the
// function's own metadata (AdsFunctionDefinition.icon), never by display
// label. This is the exact set of icon names used across the production
// catalog (see ads-check-pro-workspace-data.ts) mapped to their lucide-react
// components. Shared by the Function Store row and the Workflow step card.
export const functionIcons: Record<string, LucideIcon> = {
  pencil: Pencil, unlink: Unlink, 'share-2': Share2, 'circle-x': CircleX,
  'refresh-cw': RefreshCw, 'bar-chart-2': Circle, edit: Edit, bolt: Bolt,
  user: User, 'shield-check': ShieldCheck, folder: Folder, send: Send,
  plus: Plus, 'trash-2': Trash2, 'credit-card': CreditCard, receipt: Receipt,
  eye: Eye, upload: Upload, star: Star, link: LinkIcon, phone: Circle,
  users: Users, shield: Shield, mail: Mail, image: ImageIcon,
  'building-2': Building2, 'x-circle': XCircle, 'message-circle': MessageCircle,
  'rotate-cw': RefreshCw, 'map-pin': Circle, 'file-text': FileText,
  'rotate-ccw': RefreshCw, trash: Trash, 'log-out': LogOut, 'log-in': LogIn,
  minus: Minus, megaphone: Megaphone, globe: Globe, settings: Settings,
}
