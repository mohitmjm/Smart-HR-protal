'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useTimezone } from '../../lib/hooks/useTimezone';

interface AdminRegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecord: {
    _id: string;
    date: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      employeeId: string;
      department: string;
      position: string;
    };
    status: string;
    clockIn?: string;
    clockOut?: string;
    totalHours?: number;
    notes?: string;
  } | null;
  onConfirm: () => Promise<void>;
}

export default function AdminRegularizationModal({ 
  isOpen, 
  onClose, 
  attendanceRecord,
  onConfirm
}: AdminRegularizationModalProps) {
  const { formatDateString, formatTime } = useTimezone();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateString(dateString, format)
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!attendanceRecord) return;

    setIsProcessing(true);
    setError('');

    try {
      await onConfirm();
      setSuccess(true);
      
      // Show success message briefly before closing
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regularize attendance record');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing && !success) {
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen || !attendanceRecord) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Admin Regularization
              </h3>
              <p className="text-sm text-gray-600">
                Directly regularize an attendance record
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing || success}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Attendance Regularized Successfully!
              </h4>
              <p className="text-gray-600">
                The attendance record has been updated to regularized status.
              </p>
            </div>
          ) : (
            /* Confirmation State */
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Employee Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">
                      {attendanceRecord.user.firstName} {attendanceRecord.user.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-semibold text-gray-900">{attendanceRecord.user.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold text-gray-900">{attendanceRecord.user.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p className="font-semibold text-gray-900">{attendanceRecord.user.position}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Details */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Attendance Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Date</p>
                    <p className="font-semibold text-blue-900">
                      {safeFormatDate(attendanceRecord.date, 'dddd, MMMM DD, YYYY')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Current Status</p>
                    <p className="font-semibold text-blue-900 capitalize">{attendanceRecord.status}</p>
                  </div>
                  {attendanceRecord.clockIn && (
                    <div>
                      <p className="text-sm text-blue-600">Clock In</p>
                      <p className="font-semibold text-blue-900">
                        {formatTime(new Date(attendanceRecord.clockIn))}
                      </p>
                    </div>
                  )}
                  {attendanceRecord.clockOut && (
                    <div>
                      <p className="text-sm text-blue-600">Clock Out</p>
                      <p className="font-semibold text-blue-900">
                        {formatTime(new Date(attendanceRecord.clockOut))}
                      </p>
                    </div>
                  )}
                  {attendanceRecord.totalHours && (
                    <div>
                      <p className="text-sm text-blue-600">Total Hours</p>
                      <p className="font-semibold text-blue-900">
                        {attendanceRecord.totalHours.toFixed(2)} hours
                      </p>
                    </div>
                  )}
                </div>
                {attendanceRecord.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-blue-600">Notes</p>
                    <p className="text-sm text-blue-900 bg-blue-100 p-2 rounded">
                      {attendanceRecord.notes}
                    </p>
                  </div>
                )}
              </div>


              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4" />
                      <span>Regularize Attendance</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
