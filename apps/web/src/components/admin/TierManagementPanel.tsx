'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  User,
  Shield,
  Clock,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  Settings,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  UserTier,
  UserTierInfo,
  TierOverrideRequest,
  TemporaryAccessRequest,
  AdminAction,
  TierManagementStats
} from '@/types/admin-controls';

interface TierManagementPanelProps {
  className?: string;
}

export function TierManagementPanel({ className }: TierManagementPanelProps) {
  const [selectedUser, setSelectedUser] = useState<UserTierInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserTierInfo[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAction[]>([]);
  const [stats, setStats] = useState<TierManagementStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Override form state
  const [overrideForm, setOverrideForm] = useState({
    newTier: 'professional' as UserTier,
    reason: '',
    duration: '',
    notifyUser: true,
    isOpen: false
  });

  // Temporary access form state
  const [accessForm, setAccessForm] = useState({
    grantedTier: 'professional' as UserTier,
    reason: '',
    duration: '60', // minutes
    notifyUser: true,
    isOpen: false
  });

  // Load initial data
  useEffect(() => {
    loadStats();
    loadRecentAuditLog();
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tier-stats');
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const loadRecentAuditLog = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audit-log?limit=20');
      if (!response.ok) throw new Error('Failed to load audit log');
      const data = await response.json();
      setAuditLog(data.actions);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    }
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.users);
    } catch (error) {
      setError('Failed to search users');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserDetails = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/tier-info`);
      if (!response.ok) throw new Error('Failed to get user details');
      const data = await response.json();
      setSelectedUser(data.userInfo);
    } catch (error) {
      setError('Failed to load user details');
      console.error('User details error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTierOverride = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const request: TierOverrideRequest = {
        userId: selectedUser.userId,
        newTier: overrideForm.newTier,
        reason: overrideForm.reason,
        duration: overrideForm.duration ? parseInt(overrideForm.duration) : undefined,
        notifyUser: overrideForm.notifyUser
      };

      const response = await fetch('/api/admin/tier-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tier override');
      }

      const data = await response.json();
      toast.success('Tier override created successfully');

      // Refresh user details and stats
      await getUserDetails(selectedUser.userId);
      await loadStats();
      await loadRecentAuditLog();

      // Reset form
      setOverrideForm(prev => ({ ...prev, isOpen: false, reason: '', duration: '' }));

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create tier override');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemporaryAccess = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const request: TemporaryAccessRequest = {
        userId: selectedUser.userId,
        grantedTier: accessForm.grantedTier,
        reason: accessForm.reason,
        duration: parseInt(accessForm.duration),
        notifyUser: accessForm.notifyUser
      };

      const response = await fetch('/api/admin/temporary-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to grant temporary access');
      }

      const data = await response.json();
      toast.success('Temporary access granted successfully');

      // Refresh user details and stats
      await getUserDetails(selectedUser.userId);
      await loadStats();
      await loadRecentAuditLog();

      // Reset form
      setAccessForm(prev => ({ ...prev, isOpen: false, reason: '', duration: '60' }));

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to grant temporary access');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierBadgeVariant = (tier: UserTier) => {
    switch (tier) {
      case 'enterprise': return 'default';
      case 'professional': return 'secondary';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tier Management</h2>
          <p className="text-muted-foreground">
            Manage user tiers, overrides, and temporary access grants
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadStats();
            loadRecentAuditLog();
          }}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Active Overrides</p>
                  <p className="text-2xl font-bold">{stats.activeOverrides}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Grants</p>
                  <p className="text-2xl font-bold">{stats.activeGrants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Total Overrides</p>
                  <p className="text-2xl font-bold">{stats.totalOverrides}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Total Grants</p>
                  <p className="text-2xl font-bold">{stats.totalGrants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  User Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search by email or user ID</Label>
                  <Input
                    id="search"
                    placeholder="Enter email or user ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                )}

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => getUserDetails(user.userId)}
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{user.email}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getTierBadgeVariant(user.currentTier)}>
                              {user.currentTier}
                            </Badge>
                            {user.hasActiveOverride && (
                              <Badge variant="outline" className="text-xs">Override</Badge>
                            )}
                            {user.hasActiveGrant && (
                              <Badge variant="outline" className="text-xs">Grant</Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected User Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUser ? (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{selectedUser.email}</p>
                      </div>
                      <div>
                        <Label>Current Tier</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={getTierBadgeVariant(selectedUser.currentTier)}>
                            {selectedUser.currentTier}
                          </Badge>
                          {selectedUser.originalTier && selectedUser.originalTier !== selectedUser.currentTier && (
                            <span className="text-sm text-muted-foreground">
                              (Originally: {selectedUser.originalTier})
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          {selectedUser.hasActiveOverride && (
                            <Badge variant="outline" className="text-blue-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Active Override
                            </Badge>
                          )}
                          {selectedUser.hasActiveGrant && (
                            <Badge variant="outline" className="text-green-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Temporary Access
                            </Badge>
                          )}
                          {!selectedUser.hasActiveOverride && !selectedUser.hasActiveGrant && (
                            <Badge variant="outline" className="text-gray-600">
                              Normal Access
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Override Details */}
                    {selectedUser.overrideDetails && (
                      <div className="border rounded-lg p-3 bg-blue-50">
                        <h4 className="font-medium text-blue-900 mb-2">Active Override</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Tier:</strong> {selectedUser.overrideDetails.overrideTier}</p>
                          <p><strong>Reason:</strong> {selectedUser.overrideDetails.reason}</p>
                          <p><strong>Admin:</strong> {selectedUser.overrideDetails.adminEmail}</p>
                          <p><strong>Created:</strong> {selectedUser.overrideDetails.createdAt.toLocaleDateString()}</p>
                          {selectedUser.overrideDetails.expiresAt && (
                            <p><strong>Expires:</strong> {selectedUser.overrideDetails.expiresAt.toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Grant Details */}
                    {selectedUser.grantDetails && (
                      <div className="border rounded-lg p-3 bg-green-50">
                        <h4 className="font-medium text-green-900 mb-2">Temporary Access</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Tier:</strong> {selectedUser.grantDetails.grantedTier}</p>
                          <p><strong>Reason:</strong> {selectedUser.grantDetails.reason}</p>
                          <p><strong>Admin:</strong> {selectedUser.grantDetails.adminEmail}</p>
                          <p><strong>Duration:</strong> {formatDuration(selectedUser.grantDetails.duration)}</p>
                          <p><strong>Expires:</strong> {selectedUser.grantDetails.expiresAt.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4">
                      <Dialog open={overrideForm.isOpen} onOpenChange={(open) => setOverrideForm(prev => ({ ...prev, isOpen: open }))}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Shield className="h-4 w-4 mr-1" />
                            Override Tier
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Tier Override</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>New Tier</Label>
                              <Select
                                value={overrideForm.newTier}
                                onValueChange={(value: UserTier) => setOverrideForm(prev => ({ ...prev, newTier: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Reason (required)</Label>
                              <Textarea
                                placeholder="Explain why this override is needed..."
                                value={overrideForm.reason}
                                onChange={(e) => setOverrideForm(prev => ({ ...prev, reason: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label>Duration (days, leave empty for permanent)</Label>
                              <Input
                                type="number"
                                placeholder="30"
                                value={overrideForm.duration}
                                onChange={(e) => setOverrideForm(prev => ({ ...prev, duration: e.target.value }))}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={overrideForm.notifyUser}
                                onCheckedChange={(checked) => setOverrideForm(prev => ({ ...prev, notifyUser: checked }))}
                              />
                              <Label>Notify user via email</Label>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setOverrideForm(prev => ({ ...prev, isOpen: false }))}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleTierOverride}
                                disabled={!overrideForm.reason.trim() || isLoading}
                              >
                                Create Override
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={accessForm.isOpen} onOpenChange={(open) => setAccessForm(prev => ({ ...prev, isOpen: open }))}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Clock className="h-4 w-4 mr-1" />
                            Grant Access
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Grant Temporary Access</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Granted Tier</Label>
                              <Select
                                value={accessForm.grantedTier}
                                onValueChange={(value: UserTier) => setAccessForm(prev => ({ ...prev, grantedTier: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Reason (required)</Label>
                              <Textarea
                                placeholder="Explain why temporary access is needed..."
                                value={accessForm.reason}
                                onChange={(e) => setAccessForm(prev => ({ ...prev, reason: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label>Duration (minutes)</Label>
                              <Select
                                value={accessForm.duration}
                                onValueChange={(value) => setAccessForm(prev => ({ ...prev, duration: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="60">1 hour</SelectItem>
                                  <SelectItem value="240">4 hours</SelectItem>
                                  <SelectItem value="480">8 hours</SelectItem>
                                  <SelectItem value="1440">24 hours</SelectItem>
                                  <SelectItem value="2880">2 days</SelectItem>
                                  <SelectItem value="10080">1 week</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={accessForm.notifyUser}
                                onCheckedChange={(checked) => setAccessForm(prev => ({ ...prev, notifyUser: checked }))}
                              />
                              <Label>Notify user via email</Label>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setAccessForm(prev => ({ ...prev, isOpen: false }))}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleTemporaryAccess}
                                disabled={!accessForm.reason.trim() || isLoading}
                              >
                                Grant Access
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a user to view details and manage their tier</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Recent Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((action) => (
                      <TableRow key={action.id}>
                        <TableCell className="font-mono text-xs">
                          {action.timestamp.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {action.adminEmail}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {action.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {action.targetUserEmail}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {action.reason}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {action.oldValue && action.newValue && (
                            <span>{action.oldValue} → {action.newValue}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}