'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, CalendarIcon, CheckIcon } from '@heroicons/react/24/outline';
import TimezoneSelector from '../global/TimezoneSelector';

interface ClerkUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
  lastSignInAt: string;
  organization: string;
}

interface SelectedUser extends ClerkUser {
  department: string;
  position: string;
  joinDate: string;
  managerId?: string;
  organization: string;
  timezone: string;
  workLocation: string;
  contactNumber: string;
  isActive: boolean;
  isHRManager: boolean;
}

interface ClerkUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsersAdded: () => void;
}

export default function ClerkUsersModal({ isOpen, onClose, onUsersAdded }: ClerkUsersModalProps) {
  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userDetails, setUserDetails] = useState<Map<string, SelectedUser>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle focus management when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Return focus to document when modal closes
      document.body.focus();
    }
  }, [isOpen]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dynamic departments from positions data
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Dynamic positions from database
  const [positions, setPositions] = useState<string[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClerkUsers();
      fetchPositions();
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchClerkUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users/clerk-users');
      const data = await response.json();
      
      if (data.success) {
        setClerkUsers(data.data.users);
      } else {
        setError(data.error || 'Failed to fetch Clerk users');
      }
    } catch (error) {
      console.error('Error fetching Clerk users:', error);
      setError('Failed to fetch Clerk users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      setPositionsLoading(true);
      const response = await fetch('/api/admin/orgstructure/positions');
      const data = await response.json();
      
      if (data.success) {
        // Extract unique position names from the database
        const positionNames = [...new Set(data.data.map((pos: any) => pos.name))] as string[];
        setPositions(positionNames);
      } else {
        console.error('Positions fetch failed:', data.error);
        // No fallback data - rely on MongoDB
        setPositions([]);
      }
    } catch (error) {
      console.error('Positions fetch error:', error);
      // No fallback data - rely on MongoDB
      setPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const response = await fetch('/api/admin/orgstructure/departments');
      const data = await response.json();
      
      if (data.success) {
        // Extract department names from the API response
        const departmentNames = data.data.map((dept: any) => dept.name);
        setDepartments(departmentNames);
      } else {
        console.error('Departments fetch failed:', data.error);
        // No fallback data - rely on MongoDB
        setDepartments([]);
      }
    } catch (error) {
      console.error('Departments fetch error:', error);
      // No fallback data - rely on MongoDB
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
      const newDetails = new Map(userDetails);
      newDetails.delete(userId);
      setUserDetails(newDetails);
    } else {
      newSelected.add(userId);
      const user = clerkUsers.find(u => u.id === userId);
      if (user) {
        const newDetails = new Map(userDetails);
        newDetails.set(userId, {
          ...user,
          department: '',
          position: '',
          joinDate: new Date().toISOString().split('T')[0],
          organization: user.organization,
          timezone: 'UTC',
          workLocation: '',
          contactNumber: '',
          isActive: true,
          isHRManager: false
        });
        setUserDetails(newDetails);
      }
    }
    setSelectedUsers(newSelected);
  };

  const handleUserDetailChange = (userId: string, field: string, value: any) => {
    const newDetails = new Map(userDetails);
    const userDetail = newDetails.get(userId);
    if (userDetail) {
      newDetails.set(userId, {
        ...userDetail,
        [field]: value
      });
      setUserDetails(newDetails);
    }
  };

  const handleAddUsers = async () => {
    if (selectedUsers.size === 0) {
      setError('Please select at least one user to add');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const usersToAdd = Array.from(selectedUsers).map(userId => {
        const details = userDetails.get(userId);
        if (!details) throw new Error('User details not found');
        
        return {
          clerkUserId: details.id,
          email: details.email,
          firstName: details.firstName,
          lastName: details.lastName,
          department: details.department,
          position: details.position,
          joinDate: details.joinDate,
          managerId: details.managerId,
          organization: details.organization,
          timezone: details.timezone,
          workLocation: details.workLocation,
          contactNumber: details.contactNumber,
          isActive: details.isActive,
          isHRManager: details.isHRManager
        };
      });

      const response = await fetch('/api/admin/users/add-clerk-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: usersToAdd }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully added ${data.data.summary.successful} users. ${data.data.summary.failed} failed.`);
        // Refresh the users list and close modal after a short delay
        setTimeout(() => {
          onUsersAdded();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to add users');
      }
    } catch (error) {
      console.error('Error adding users:', error);
      setError('Failed to add users');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">
              Add Users from Clerk
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Users List */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Available Users from Clerk ({clerkUsers.length})
              </h4>
              
              {clerkUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No new users available from Clerk. All Clerk users are already in the system.
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {clerkUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-gray-900">{user.fullName}</h5>
                              {selectedUsers.has(user.id) && (
                                <CheckIcon className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                {user.email}
                              </div>
                              {user.organization && (
                                <div className="flex items-center">
                                  <span className="font-medium">Org:</span> {user.organization}
                                </div>
                              )}
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Joined: {formatDate(user.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Details Form - Only show if selected */}
                      {selectedUsers.has(user.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department *
                              </label>
                              <select
                                value={userDetails.get(user.id)?.department || ''}
                                onChange={(e) => handleUserDetailChange(user.id, 'department', e.target.value)}
                                disabled={departmentsLoading}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  departmentsLoading ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                              >
                                <option value="">{departmentsLoading ? 'Loading departments...' : 'Select Department'}</option>
                                {departments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position *
                              </label>
                              <select
                                value={userDetails.get(user.id)?.position || ''}
                                onChange={(e) => handleUserDetailChange(user.id, 'position', e.target.value)}
                                disabled={positionsLoading}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  positionsLoading ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                              >
                                <option value="">{positionsLoading ? 'Loading positions...' : 'Select Position'}</option>
                                {positions.map(pos => (
                                  <option key={pos} value={pos}>{pos}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Join Date *
                              </label>
                              <input
                                type="date"
                                value={userDetails.get(user.id)?.joinDate || ''}
                                onChange={(e) => handleUserDetailChange(user.id, 'joinDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Timezone
                              </label>
                              <TimezoneSelector
                                value={userDetails.get(user.id)?.timezone || 'UTC'}
                                onChange={(timezone) => handleUserDetailChange(user.id, 'timezone', timezone)}
                                placeholder="Select timezone"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Work Location
                              </label>
                              <input
                                type="text"
                                value={userDetails.get(user.id)?.workLocation || ''}
                                onChange={(e) => handleUserDetailChange(user.id, 'workLocation', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., New York Office, Remote"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Number
                              </label>
                              <input
                                type="tel"
                                value={userDetails.get(user.id)?.contactNumber || ''}
                                onChange={(e) => handleUserDetailChange(user.id, 'contactNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`active-${user.id}`}
                                  checked={userDetails.get(user.id)?.isActive || false}
                                  onChange={(e) => handleUserDetailChange(user.id, 'isActive', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`active-${user.id}`} className="ml-2 block text-sm text-gray-900">
                                  Active User
                                </label>
                              </div>

                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`hr-${user.id}`}
                                  checked={userDetails.get(user.id)?.isHRManager || false}
                                  onChange={(e) => handleUserDetailChange(user.id, 'isHRManager', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`hr-${user.id}`} className="ml-2 block text-sm text-gray-900">
                                  HR Manager
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedUsers.size} user(s) selected
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUsers}
                  disabled={isSaving || selectedUsers.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Adding Users...' : `Add ${selectedUsers.size} User(s)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
