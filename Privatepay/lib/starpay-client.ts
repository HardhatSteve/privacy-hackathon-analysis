const INTERNAL_API_BASE = "/api/starpay"

export interface CardCreateRequest {
  amount: number
  cardType: "visa" | "mastercard"
  email: string
}

export interface CardResponse {
  success: boolean
  cardId: string
  totalCharged: number
  status: "pending" | "processing" | "completed" | "failed"
  message: string
}

export interface CardStatusResponse {
  cardId: string
  status: "pending" | "processing" | "completed" | "failed"
  cardType: "visa" | "mastercard"
  amount: number
  email: string
  createdAt: string
}

export interface AccountInfo {
  walletAddress: string
  projectName: string
  balance: number
  markup: number
  totalCardsIssued: number
  totalVolume: number
  status: "active" | "inactive"
}

export interface ErrorResponse {
  success?: boolean
  error?: string
  message?: string
  required?: number
  available?: number
}

export async function createCard(request: CardCreateRequest): Promise<CardResponse> {
  try {
    const response = await fetch(`${INTERNAL_API_BASE}/cards/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    const data: CardResponse | ErrorResponse = await response.json()

    if (!response.ok) {
      const errorData = data as ErrorResponse

      if (errorData.error === "STARPAY_API_KEY_MISSING") {
        throw new Error("Server configuration error. Contact support.")
      }

      if (response.status === 402) {
        throw new Error(
          `Insufficient balance. Need: $${errorData.required?.toFixed(2)}, Available: $${errorData.available?.toFixed(2)}`,
        )
      }
      if (response.status === 429) {
        throw new Error("Rate limited. Please wait a moment before trying again.")
      }
      if (response.status === 401) {
        throw new Error("Authentication failed. Check API configuration.")
      }
      if (response.status === 400) {
        throw new Error(errorData.error || errorData.message || "Invalid card parameters")
      }

      throw new Error(errorData.message || "Failed to create card")
    }

    return data as CardResponse
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Network error. Please check your connection.")
  }
}

export async function getCardStatus(cardId: string): Promise<CardStatusResponse> {
  try {
    const response = await fetch(`${INTERNAL_API_BASE}/cards/status?cardId=${cardId}`)

    const data: CardStatusResponse | ErrorResponse = await response.json()

    if (!response.ok) {
      const errorData = data as ErrorResponse

      if (errorData.error === "STARPAY_API_KEY_MISSING") {
        throw new Error("Server configuration error. Contact support.")
      }

      if (response.status === 404) {
        throw new Error("Card not found.")
      }
      if (response.status === 401) {
        throw new Error("Authentication failed.")
      }

      throw new Error(errorData.message || "Failed to fetch card status")
    }

    return data as CardStatusResponse
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Network error checking card status.")
  }
}

export async function getAccountInfo(): Promise<AccountInfo> {
  try {
    const response = await fetch(`${INTERNAL_API_BASE}/me`)

    const data: AccountInfo | ErrorResponse = await response.json()

    if (!response.ok) {
      const errorData = data as ErrorResponse

      if (errorData.error === "STARPAY_API_KEY_MISSING") {
        throw new Error("Server configuration error. Contact support.")
      }

      if (response.status === 401) {
        throw new Error("Authentication failed. Check API configuration.")
      }

      throw new Error(errorData.message || "Failed to fetch account info")
    }

    return data as AccountInfo
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Network error fetching account info.")
  }
}

export async function getAccountBalance() {
  try {
    const response = await fetch("/api/starpay/me")
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch account balance")
    }

    return {
      balance: data.balance || 0,
      totalCardsIssued: data.totalCardsIssued || 0,
      totalVolume: data.totalVolume || 0,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Network error fetching account balance.")
  }
}
