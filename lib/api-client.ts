import api from "./api"
import type {
  PaginatedResponse,
  Coupon,
  Comment as CouponComment,
} from "./types"

export const couponApi = {
  getAll: async (params?: { page?: number; page_size?: number; bet_app?: string }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }
    const { data } = await api.get<PaginatedResponse<Coupon>>(`/mobcash/v2/coupons?${queryParams.toString()}`)
    return data
  },

  getById: async (id: string) => {
    const { data } = await api.get<Coupon>(`/mobcash/v2/coupons/${id}`)
    return data
  },

  create: async (couponData: {
    bet_app_id: string
    code: string
    odds: string
    coupon_type: "single" | "combine"
    match_count: number
    description?: string
    stake?: string
    date_expiration?: string
  }) => {
    const { data } = await api.post<Coupon>("/mobcash/v2/coupons", {
      ...couponData,
      bet_app: couponData.bet_app_id
    })
    return data
  },

  vote: async (couponId: string, voteType: "win" | "lose") => {
    const { data } = await api.post(`/mobcash/v2/coupons/${couponId}/vote`, { vote: voteType })
    return data
  },

  getComments: async (couponAuthorId: string) => {
    const { data } = await api.get<PaginatedResponse<CouponComment>>(
      `/mobcash/v2/author-comments?author=${couponAuthorId}`
    )
    return data
  },

  postComment: async (commentData: {
    coupon: string
    content: string
  }) => {
    const { data } = await api.post<CouponComment>("/mobcash/v2/author-comments", commentData)
    return data
  },

  getStats: async (userId: string) => {
    const { data } = await api.get(`/mobcash/v2/author-stats/${userId}`)
    return data
  },

  getWallet: async () => {
    const { data } = await api.get("/mobcash/v2/coupon-wallet")
    return data
  },

  withdraw: async (amount: number) => {
    const { data } = await api.post("/mobcash/v2/coupon-wallet-withdraw", { amount })
    return data
  },

  getUserStats: async () => {
    const { data } = await api.get("/mobcash/v2/user/coupon-stats")
    return data
  },
}

export const settingsApi = {
  get: async () => {
    const { data } = await api.get("/mobcash/setting")
    return data
  },
}
