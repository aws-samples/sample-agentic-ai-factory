import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Building2, Mail, Calendar, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { userManagementService, User, Organization } from '../services/userManagementService';
import { useOrganization } from '../contexts/OrganizationContext';

export function Team() {
  const { selectedOrganization: currentOrg, currentUser, isAdmin } = useOrganization();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to load data...');
      
      // Load all data in parallel
      const [allUsers, roles, orgs] = await Promise.all([
        userManagementService.listUsers(),
        userManagementService.listAvailableRoles(),
        userManagementService.listOrganizations(),
      ]);
      
      console.log('Loaded users:', allUsers);
      console.log('Loaded roles from Cognito:', roles);
      console.log('Loaded organizations from DynamoDB:', orgs);
      
      setUsers(allUsers);
      setAvailableRoles(roles);
      setOrganizations(orgs);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      console.error('Error details:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      setError('Please select both a role and organization');
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      await userManagementService.assignUserRole({
        userId: selectedUser.userId,
        role: selectedRole,
        organization: selectedOrganization || undefined,
      });

      // Reload data to get updated users
      await loadData();

      // Close modal and reset
      setSelectedUser(null);
      setSelectedRole('');
      setSelectedOrganization('');
    } catch (err: any) {
      console.error('Failed to assign role:', err);
      setError(err.message || 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  // Filter users based on role and organization
  const filteredUsers = (() => {
    if (isAdmin) {
      // Admins see all users
      return users;
    } else {
      // Non-admins only see users in their organization (and users with no org)
      const userOrg = currentUser?.organization;
      return users.filter(u => 
        u.role && // Only show users with roles (no lobby access)
        (u.organization === userOrg || !u.organization)
      );
    }
  })();

  // Users without roles are in the lobby (only visible to admins)
  const lobbyUsers = isAdmin ? filteredUsers.filter(u => !u.role) : [];
  const activeUsers = filteredUsers.filter(u => u.role);

  // Further filter by selected organization if one is chosen (and not "All Organizations")
  const shouldFilterByOrg = currentOrg && currentOrg !== 'All Organizations';
  
  const displayedLobbyUsers = shouldFilterByOrg
    ? lobbyUsers.filter(u => !u.organization || u.organization === currentOrg)
    : lobbyUsers;
  
  const displayedActiveUsers = shouldFilterByOrg
    ? activeUsers.filter(u => u.organization === currentOrg)
    : activeUsers;

  // console.log('Debug - currentOrg:', currentOrg);
  // console.log('Debug - shouldFilterByOrg:', shouldFilterByOrg);
  // console.log('Debug - users:', users.length);
  // console.log('Debug - filteredUsers:', filteredUsers.length);
  // console.log('Debug - lobbyUsers:', lobbyUsers.length);
  // console.log('Debug - activeUsers:', activeUsers.length);
  // console.log('Debug - displayedLobbyUsers:', displayedLobbyUsers.length);
  // console.log('Debug - displayedActiveUsers:', displayedActiveUsers.length);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'developer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  return (
    <div className="flex-1 p-6 bg-[#0f1319]">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold mb-2">Team Management</h1>
        <p className="text-[#9ca3af] text-sm">
          Manage team members, roles, and organization assignments
          {currentOrg && currentOrg !== 'All Organizations' && (
            <span className="ml-2 text-[#f90]">• Filtered by {currentOrg}</span>
          )}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f90] mx-auto mb-4"></div>
            <p className="text-[#9ca3af]">Loading users...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="flex gap-4 mb-6">
        <Card className="flex-1 bg-[#1a1f2e] border-[#2a3142]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-sm">Total Users</p>
                <p className="text-white text-2xl font-bold">{filteredUsers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="flex-1 bg-[#1a1f2e] border-[#2a3142]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#9ca3af] text-sm">Pending Assignment</p>
                  <p className="text-white text-2xl font-bold">{displayedLobbyUsers.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 bg-[#1a1f2e] border-[#2a3142]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-sm">Active Members</p>
                <p className="text-white text-2xl font-bold">{displayedActiveUsers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 bg-[#1a1f2e] border-[#2a3142]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9ca3af] text-sm">Your Role</p>
                <p className="text-white text-2xl font-bold capitalize">{currentUser?.role || 'N/A'}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout - Lobby and Active Users */}
      <div className="flex gap-6">
        {/* Lobby Section - Only visible to admins */}
        {isAdmin && displayedLobbyUsers.length > 0 && (
          <div className="flex-1">
            <Card className="bg-[#1a1f2e] border-[#2a3142]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-yellow-400" />
                      Lobby - Pending Assignment
                    </CardTitle>
                    <CardDescription className="text-[#9ca3af]">
                      New users waiting to be assigned a role and organization
                    </CardDescription>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                    {displayedLobbyUsers.length} pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayedLobbyUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 bg-[#0f1319] border border-[#2a3142] rounded-lg hover:border-yellow-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-white text-[#0f1319] hover:bg-[#f2f3f3]"
                          onClick={() => setSelectedUser(user)}
                        >
                          Assign Role
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Users Section */}
        <div className="flex-1">
          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Active Team Members</CardTitle>
                  <CardDescription className="text-[#9ca3af]">
                    Users with assigned roles and organizations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayedActiveUsers.length > 0 ? (
                  displayedActiveUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-4 bg-[#0f1319] border border-[#2a3142] rounded-lg hover:border-[#f90] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.name}</p>
                        <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                        {user.organization && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                            <Building2 className="w-3 h-3 mr-1" />
                            {user.organization}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button className="text-[#9ca3af] hover:text-white transition-colors ml-4">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-[#6b7280] mx-auto mb-3" />
                    <p className="text-[#9ca3af]">No team members found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      )}

      {/* Assignment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-[#1a1f2e] border-[#2a3142] w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Assign Role & Organization</CardTitle>
              <CardDescription className="text-[#9ca3af]">
                Assign {selectedUser.name} to a role and organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Role</label>
                <select 
                  className="w-full px-3 py-2 bg-[#0f1319] border border-[#2a3142] rounded text-white"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Select a role...</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Organization</label>
                <select 
                  className="w-full px-3 py-2 bg-[#0f1319] border border-[#2a3142] rounded text-white"
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                >
                  <option value="">Select an organization...</option>
                  {organizations.map((org) => (
                    <option key={org.orgId} value={org.name}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-white text-[#0f1319] hover:bg-[#f2f3f3]"
                  onClick={handleAssignRole}
                  disabled={assigning || !selectedRole}
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[#2a3142] text-white hover:bg-[#2a3142]"
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
