'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { 
  UsersIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface TeamStats {
  teamId: string;
  teamName: string;
  totalMembers: number;
  checkInsToday: number;
  leavesNextWeek: number;
  regularizationRequestsMTD: number;
}

interface TeamStatsViewProps {
  userId: string;
}

export default function TeamStatsView({ userId }: TeamStatsViewProps) {
  const { user, isLoaded } = useUser()
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchTeamStats = useCallback(async (retryAttempt = 0) => {
    if (!user?.id || !isLoaded) return
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/teams/stats', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch team statistics`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTeamStats(data.data);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(data.error || 'Failed to fetch team statistics');
      }
    } catch (err) {
      console.error('Error fetching team stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Retry logic for network errors
      if (retryAttempt < 2 && (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network'))) {
        console.log(`Retrying team stats fetch (attempt ${retryAttempt + 1})`);
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          fetchTeamStats(retryAttempt + 1);
        }, 1000 * (retryAttempt + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, isLoaded]);

  useEffect(() => {
    if (user?.id && isLoaded) {
      fetchTeamStats();
    }
  }, [user?.id, isLoaded, fetchTeamStats]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Error loading team statistics</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (teamStats.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No teams found</p>
            <p className="text-gray-500 text-sm mt-2">Create teams to view statistics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <UsersIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Team Overview</h2>
              <p className="text-gray-600">Your teams at a glance</p>
            </div>
          </div>
        </div>
        
        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamStats.map((team) => (
            <div
              key={team.teamId}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              {/* Team Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 truncate">{team.teamName}</h3>
                <p className="text-sm text-gray-600">{team.totalMembers} members</p>
              </div>
              
              {/* Team Stats */}
              <div className="p-4 space-y-4">
                {/* Check-ins Today */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Check-ins Today</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      {team.checkInsToday}
                    </span>
                    <span className="text-xs text-gray-500 block">/ {team.totalMembers}</span>
                  </div>
                </div>

                {/* Leaves Next Week */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Leaves Next Week</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">
                      {team.leavesNextWeek}
                    </span>
                    <span className="text-xs text-gray-500 block">people</span>
                  </div>
                </div>

                {/* Regularization Requests MTD */}
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Regularization (MTD)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600">
                      {team.regularizationRequestsMTD}
                    </span>
                    <span className="text-xs text-gray-500 block">pending</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
