import type { TransactionType, TransactionStatus, SourceType } from './constants'

export interface Network {
  id: number
  created_at: string
  uid?: string
  name: string
  placeholder: string
  public_name: string
  country_code: string
  indication: string
  image: string
  withdrawal_message: string | null
  deposit_api: string
  withdrawal_api: string
  payment_by_link: boolean
  otp_required: boolean
  deposit_message: string
  active_for_deposit: boolean
  active_for_with: boolean
}

export interface Platform {
  id: string
  name: string
  image: string
  enable: boolean
  minimun_deposit: number
  max_deposit: number
  minimun_with: number
  max_win: number
  city?: string
  street?: string
  deposit_tuto_link?: string | null
  withdrawal_tuto_link?: string | null
  why_withdrawal_fail?: string | null
  public_name?: string
}

export interface UserPhone {
  id: number
  phone: string
  network: number
  created_at: string
}

export interface UserAppId {
  id: number
  user_app_id: string
  app: string
  created_at: string
}

export interface Transaction {
  id: number
  uid?: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  amount: number
  reference: string
  type_trans: TransactionType
  status: TransactionStatus
  created_at: string
  phone_number: string
  user_app_id: string
  withdriwal_code?: string
  app: string
  network: number
  source: SourceType
  app_details?: {
    id: string
    name: string
    image?: string
    enable?: boolean
    deposit_tuto_link?: string | null
    withdrawal_tuto_link?: string | null
    why_withdrawal_fail?: string | null
    city?: string
    street?: string
    minimun_deposit?: number
    max_deposit?: number
    minimun_with?: number
    max_win?: number
    active_for_deposit?: boolean
    active_for_with?: boolean
  }
  transaction_link?: string
  ussd_code?: string
  payment_by_link?: boolean
  whatsapp_link?: string
}

export interface Notification {
  id: number
  title: string
  content: string
  is_read: boolean
  created_at: string
  reference: string | null
}

export interface Bonus {
  id: number
  amount: string
  reason_bonus: string
  created_at: string
  user: string
}

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  balance: number
  bonus_available: number
  referral_code: string
  is_staff: boolean
  can_publish_coupons?: boolean
  can_rate_coupons?: boolean
  coupon_points?: number
}

export interface Coupon {
  id: string
  created_at: string
  code: string
  bet_app: Platform
  author: string
  author_first_name?: string
  author_last_name?: string
  author_rating?: number
  coupon_type: 'combine' | 'single'
  odds: string
  match_count: number
  average_rating: number
  total_ratings: number
  likes_count: number
  dislikes_count: number
  user_liked: boolean
  user_disliked: boolean
  can_rate: boolean
  total_comments?: number
}

export interface CommentAuthor {
  id: string
  email: string
  first_name: string
  last_name: string
}

export interface Comment {
  id: string
  content: string
  created_at: string
  author: CommentAuthor
  parent_id: string | null
  replies?: Comment[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

