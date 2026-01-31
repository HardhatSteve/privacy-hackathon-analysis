import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Send, RefreshCw, Lock, Zap, CreditCard } from 'lucide-react';
import './QuickActions.css';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      id: 'transfer',
      label: 'Private Transfer',
      icon: <Send size={18} />,
      onClick: () => console.log('Transfer clicked'),
    },
    {
      id: 'swap',
      label: 'Private Swap',
      icon: <RefreshCw size={18} />,
      onClick: () => console.log('Swap clicked'),
    },
    {
      id: 'lending',
      label: 'Private Lending',
      icon: <Lock size={18} />,
      onClick: () => console.log('Lending clicked'),
    },
    {
      id: 'staking',
      label: 'Private Staking',
      icon: <Zap size={18} />,
      onClick: () => console.log('Staking clicked'),
    },
    {
      id: 'payment',
      label: 'Private Payment',
      icon: <CreditCard size={18} />,
      onClick: () => console.log('Payment clicked'),
    },
  ];

  return (
    <Card title="Quick Actions" className="quick-actions">
      <div className="actions-grid">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            onClick={action.onClick}
            className="action-button"
          >
            {action.icon}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
