'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Heart, FileText, Target, BarChart } from 'lucide-react';

interface NavigationHubProps {
  selectedComponent: string;
  onComponentSelect: (component: string) => void;
  componentStatuses: any;
  isLoading: any;
}

export function NavigationHub({
  selectedComponent,
  onComponentSelect,
  componentStatuses,
  isLoading
}: NavigationHubProps) {
  const components = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'valuation', label: 'Valuation', icon: TrendingUp },
    { id: 'healthScore', label: 'Health Score', icon: Heart },
    { id: 'documentIntelligence', label: 'Documents', icon: FileText },
    { id: 'opportunities', label: 'Opportunities', icon: Target }
  ];

  const getStatusBadge = (componentId: string) => {
    if (componentId === 'overview') return null;
    
    const status = componentStatuses?.[componentId]?.status || 'unknown';
    const loading = isLoading?.[componentId] || false;
    
    if (loading) return <Badge variant="outline">Loading...</Badge>;
    
    const statusConfig = {
      current: { variant: 'default' as const, text: 'Current' },
      outdated: { variant: 'secondary' as const, text: 'Outdated' },
      processing: { variant: 'outline' as const, text: 'Processing' },
      error: { variant: 'destructive' as const, text: 'Error' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Badge variant={config.variant}>{config.text}</Badge> : null;
  };

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
      {components.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={selectedComponent === id ? 'default' : 'outline'}
          onClick={() => onComponentSelect(id)}
          className="flex items-center space-x-2 whitespace-nowrap"
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          {getStatusBadge(id)}
        </Button>
      ))}
    </div>
  );
}