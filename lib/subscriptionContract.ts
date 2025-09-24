import { parseEther, formatEther } from 'viem'

export const SUBSCRIPTION_CONTRACT_ABI = [
  {
    "inputs": [
      {"name": "planId", "type": "uint256"}
    ],
    "name": "subscribe",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renewSubscription", 
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "planId", "type": "uint256"}
    ],
    "name": "getSubscriptionPlan",
    "outputs": [
      {"name": "price", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "title", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "subscriber", "type": "address"}
    ],
    "name": "getSubscriptionStatus",
    "outputs": [
      {"name": "isActive", "type": "bool"},
      {"name": "expiresAt", "type": "uint256"},
      {"name": "planId", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Deployed contract address on Monad Testnet
export const SUBSCRIPTION_CONTRACT_ADDRESS = "0x279ada6ccd24f83acb09b691605f0e2c5e8f4a1c" as const

export interface SubscriptionPlan {
  id: number
  title: string
  price: string
  duration: number // in seconds
  description: string
}

// Mock subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 1,
    title: "Basic Newsletter",
    price: "0.01", // MON
    duration: 30 * 24 * 60 * 60, // 30 days
    description: "Weekly newsletter with crypto insights"
  },
  {
    id: 2,
    title: "Premium Content",
    price: "0.05", // MON
    duration: 30 * 24 * 60 * 60, // 30 days  
    description: "Access to premium articles and research"
  },
  {
    id: 3,
    title: "VIP Access",
    price: "0.1", // MON
    duration: 30 * 24 * 60 * 60, // 30 days
    description: "All content + exclusive webinars"
  }
]
