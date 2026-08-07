// src/components/OrderTracker.jsx
import React from 'react';

const OrderTracker = ({ status, trackingLink, createdAt }) => {
  // Define the stages with their details
  const stages = [
    {
      key: 'Pending',
      label: 'Order Placed',
      description: 'We have received your order',
      icon: '📦'
    },
    {
      key: 'Confirmed',
      label: 'Order Confirmed',
      description: 'Your order is being prepared',
      icon: '✓'
    },
    {
      key: 'Shipped',
      label: 'Shipped',
      description: 'Your order is on the way',
      icon: '🚚'
    },
    {
      key: 'Delivered',
      label: 'Delivered',
      description: 'Order has been delivered',
      icon: '✓'
    }
  ];

  // Determine the current stage index
  const statusMap = {
    'Pending': 0,
    'Confirmed': 1,
    'Shipped': 2,
    'Delivered': 3,
    'Cancelled': -1
  };

  const currentStageIndex = statusMap[status] ?? 0;

  // Helper to determine if a stage is completed, active, or pending
  const getStageStatus = (index) => {
    if (status === 'Cancelled') {
      return 'cancelled';
    }
    if (index < currentStageIndex) {
      return 'completed';
    }
    if (index === currentStageIndex) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="order-tracker">
      <h3 className="tracker-title">Order Status</h3>
      
      {status === 'Cancelled' && (
        <div className="cancelled-banner">
          <span className="cancelled-icon">❌</span>
          <div>
            <strong>Order Cancelled</strong>
            <p>This order has been cancelled</p>
          </div>
        </div>
      )}

      <div className="tracker-timeline">
        {stages.map((stage, index) => {
          const stageStatus = getStageStatus(index);
          
          return (
            <div key={stage.key} className={`tracker-stage ${stageStatus}`}>
              <div className="stage-content">
                <div className="stage-indicator">
                  <div className="stage-dot">
                    {stageStatus === 'completed' ? (
                      <span className="check-icon">✓</span>
                    ) : stageStatus === 'active' ? (
                      <span className="pulse-dot"></span>
                    ) : (
                      <span className="empty-dot"></span>
                    )}
                  </div>
                </div>
                
                <div className="stage-info">
                  <div className="stage-header">
                    <span className="stage-icon">{stage.icon}</span>
                    <h4 className="stage-label">{stage.label}</h4>
                  </div>
                  <p className="stage-description">{stage.description}</p>
                  
                  {/* Show timestamp for active/completed stages */}
                  {(stageStatus === 'completed' || stageStatus === 'active') && stage.key === 'Pending' && createdAt && (
                    <p className="stage-timestamp">
                      {new Date(createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  
                  {/* Show Track Order button when shipped */}
                  {stage.key === 'Shipped' && (stageStatus === 'active' || stageStatus === 'completed') && trackingLink && (
                    <a 
                      href={trackingLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="track-button"
                    >
                      Track Package 🔗
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;
