# MonaScribe — Smart‑account subscriptions on Monad

Next‑gen subscription platform powered by MetaMask Smart Accounts, demonstrating gas abstraction and auto‑renewal on Monad Testnet.

## 🌟 Features

- **Gas Abstracted Subscriptions**: Users never worry about gas fees
- **Auto-Renewal**: Set it once, forget it - subscriptions renew automatically  
- **MetaMask Smart Accounts**: Enhanced security with delegation permissions
- **Monad Integration**: Fast, low-cost transactions on Monad Testnet
- **Beautiful UI**: Modern, responsive interface

## 🏗️ Architecture

- **Frontend**: Next.js + React with TypeScript
- **Smart Accounts**: MetaMask Delegation Toolkit
- **Blockchain**: Monad Testnet (EVM-compatible)
- **Account Abstraction**: ERC-4337 compatible

## 🚀 Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Open Browser**
Navigate to `http://localhost:3000`

## 🔧 Configuration

The app is pre-configured for Monad Testnet:
- **Chain ID**: 41454
- **RPC URL**: https://testnet1.monad.xyz
- **Explorer**: https://explorer-testnet.monad.xyz

## 📱 How It Works

1. **Smart Account Creation**: The app automatically creates a MetaMask Smart Account
2. **Plan Selection**: Users choose from subscription plans (Basic, Premium, VIP)
3. **Gas-less Subscription**: Smart Account handles gas abstraction
4. **Auto-Renewal**: Delegated permissions enable automatic renewals

## 🎯 Hackathon Submission

This project demonstrates:
- ✅ MetaMask Smart Accounts integration
- ✅ Monad Testnet deployment
- ✅ Gas abstraction for seamless UX
- ✅ Delegation permissions for auto-renewal
- ✅ Account abstraction benefits

## 🚀 Production Ready

This **MetaMask Smart Accounts x Monad Dev Cook-Off** submission is **production-ready** and supports real transactions:

### **Real Features:**
- **MetaMask Integration**: ✅ Connects to real MetaMask wallets on Monad Testnet
- **Smart Account Support**: ✅ Uses MetaMask Delegation Toolkit when available
- **Real Transactions**: ✅ Processes actual subscription payments in MON
- **Monad Testnet**: ✅ Fully configured for Chain ID 10143
- **Fallback Demo**: ✅ Demo mode when MetaMask not connected

### **Network Configuration:**
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz  
- **Explorer**: https://testnet.monadexplorer.com
- **Currency**: MON

### **How to Use:**
1. **Add Monad Testnet to MetaMask**:
   - Network Name: Monad Testnet
   - RPC URL: https://testnet-rpc.monad.xyz
   - Chain ID: 10143
   - Currency: MON

2. **Get Test MON**: Visit Monad testnet faucet for test tokens

3. **Visit App**: Navigate to `http://localhost:3000` and connect MetaMask

### **Features:**
- **MetaMask Integration**: Automatically connects to MetaMask and adds Monad Testnet
- **Smart Account Detection**: Uses MetaMask Smart Accounts when available for gas abstraction
- **Standard Account Fallback**: Uses regular MetaMask transactions if Smart Accounts not supported
- **Real Subscriptions**: Process actual subscription payments in MON tokens on Monad testnet
- **Network Auto-Setup**: Automatically adds Monad Testnet to MetaMask if not present

## 📦 Dependencies

- `@metamask/delegation-toolkit`: MetaMask Smart Accounts
- `viem`: Ethereum client library
- `next.js`: React framework
- `react`: UI library

## 🌐 Deployment to Monad Testnet

For hackathon submission:
1. Deploy subscription contracts to Monad Testnet
2. Configure bundler endpoints for Monad
3. Build and deploy frontend to showcase working integration

## 🎬 Live Application

**Visit: `http://localhost:3000`**

The application provides:
- ✅ **Real MetaMask Integration**: Connects to actual MetaMask wallets
- ✅ **Monad Testnet Setup**: Automatically adds Monad Testnet to MetaMask
- ✅ **Three Subscription Plans**: Basic (0.01 MON), Premium (0.05 MON), VIP (0.1 MON)
- ✅ **Real Transactions**: Actual MON payments processed on Monad testnet
- ✅ **Smart Account Support**: Uses MetaMask Smart Accounts when available
- ✅ **Status Tracking**: Real-time updates for wallet connection and transactions
- ✅ **Error Handling**: User-friendly error messages and transaction feedback
- ✅ **Professional UI**: Beautiful gradient design with glassmorphism effects

**User Flow:**
1. Page loads → Prompts to connect MetaMask
2. MetaMask connects → Automatically adds/switches to Monad Testnet
3. Choose subscription plan → Click "Subscribe Now"
4. Approve transaction in MetaMask → Real payment processed
5. See transaction confirmation with hash on Monad explorer

---

Built for the **MetaMask Smart Accounts x Monad Dev Cook-Off** hackathon.
