import { useState } from 'react'
import { SubscriptionPlan } from '../lib/subscriptionContract'

interface SubscriptionCardProps {
  plan: SubscriptionPlan
  onSubscribe: (planId: number) => Promise<void>
  isLoading: boolean
}

export default function SubscriptionCard({ plan, onSubscribe, isLoading }: SubscriptionCardProps) {
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = async () => {
    setSubscribing(true)
    try {
      await onSubscribe(plan.id)
    } catch (error) {
      console.error('Subscription failed:', error)
    } finally {
      setSubscribing(false)
    }
  }


  return (
    <div className="subscription-card">
      <div className="card-header">
        <h3>{plan.title}</h3>
        <div className="price">
          <span className="amount">{plan.price}</span>
          <span className="currency">MON</span>
        </div>
      </div>
      
      <div className="card-body">
        <p className="description">{plan.description}</p>
        <div className="duration">
          Duration: {Math.floor(plan.duration / (24 * 60 * 60))} days
        </div>
      </div>
      
      <div className="card-footer">
        <button 
          onClick={handleSubscribe}
          disabled={subscribing || isLoading}
          className="subscribe-btn"
        >
          {subscribing ? 'Subscribing...' : 'Subscribe Now'}
        </button>
      </div>

      <style jsx>{`
        .subscription-card {
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 24px;
          margin: 16px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        
        .subscription-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .card-header {
          text-align: center;
          margin-bottom: 16px;
        }
        
        .card-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.4rem;
        }
        
        .price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }
        
        .amount {
          font-size: 2rem;
          font-weight: bold;
          color: #ff6b35;
        }
        
        .currency {
          font-size: 1rem;
          color: #666;
        }
        
        .card-body {
          margin: 16px 0;
        }
        
        .description {
          color: #666;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        
        .duration {
          font-size: 0.9rem;
          color: #888;
        }
        
        .subscribe-btn {
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .subscribe-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }
        
        .subscribe-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

      `}</style>
    </div>
  )
}
