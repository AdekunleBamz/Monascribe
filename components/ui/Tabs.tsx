import React, { useState } from 'react';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ children, defaultValue, onValueChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || '');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };
  
  return (
    <div className={`tabs ${className}`} data-active-tab={activeTab}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            activeTab, 
            onTabChange: handleTabChange 
          } as any);
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function TabsList({ children, className = '', activeTab, onTabChange }: TabsListProps) {
  return (
    <div className={`tabs-list ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            activeTab, 
            onTabChange 
          } as any);
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function TabsTrigger({ 
  children, 
  value, 
  disabled = false, 
  className = '', 
  activeTab, 
  onTabChange 
}: TabsTriggerProps) {
  const isActive = activeTab === value;
  
  return (
    <button
      className={`tab-trigger ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={() => !disabled && onTabChange?.(value)}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  activeTab?: string;
}

export function TabsContent({ children, value, className = '', activeTab }: TabsContentProps) {
  if (activeTab !== value) {
    return null;
  }
  
  return (
    <div className={`tab-content ${className}`}>
      {children}
    </div>
  );
}
