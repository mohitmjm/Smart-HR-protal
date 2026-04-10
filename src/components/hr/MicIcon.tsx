'use client'

import { useState, useRef, useEffect } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { useRouter } from 'next/navigation'
import { 
  MicrophoneIcon, 
  MicrophoneIcon as MicOffIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  CalendarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  PlayIcon 
} from '@heroicons/react/24/outline'
import { VoiceRecorder } from '@/lib/voiceRecorder'
import { VoiceCommandClient, VoiceCommandState } from '@/lib/voiceCommandClient'
import { requestLocationPermission, showLocationPermissionMessage } from '@/lib/locationPermissionUtils'
import { isGeolocationAvailable, getLocationWithAddress } from '@/lib/geolocationUtils'
import VoiceCommandChatSimple from '../VoiceCommandChatSimple'

const MicIcon = () => {
  const [mounted, setMounted] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0)
  const [commandState, setCommandState] = useState<VoiceCommandState>({
    isRecording: false,
    isProcessing: false,
    transcription: '',
    intent: null,
    error: null,
    success: false,
    nodeProgress: [],
    currentNode: undefined,
    nodeStatus: 'idle'
  })
  
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rippleRef = useRef<HTMLDivElement>(null)
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null)
  const voiceCommandClientRef = useRef<VoiceCommandClient | null>(null)
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Initialize services only on client side
    if (typeof window !== 'undefined') {
      try {
        voiceRecorderRef.current = new VoiceRecorder()
        voiceCommandClientRef.current = new VoiceCommandClient()
      } catch (error) {
        console.error('Failed to initialize voice services:', error)
        setCommandState(prev => ({ 
          ...prev, 
          error: 'Voice services not available' 
        }))
      }
    }
    
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
      }
      if (chatTimeoutRef.current) {
        clearTimeout(chatTimeoutRef.current)
      }
    }
  }, [])

  const showChatTemporarily = () => {
    setShowChat(true)
    // Clear any existing timeout
    if (chatTimeoutRef.current) {
      clearTimeout(chatTimeoutRef.current)
    }
    // Auto-hide after 5 seconds
    chatTimeoutRef.current = setTimeout(() => {
      setShowChat(false)
    }, 5000)
  }

  const showChatDuringProcessing = () => {
    setShowChat(true)
    // Clear any existing timeout
    if (chatTimeoutRef.current) {
      clearTimeout(chatTimeoutRef.current)
    }
    // Don't auto-hide during processing - will be handled by success timeout
  }

  const hideChatAfterSuccess = () => {
    // Clear any existing timeout
    if (chatTimeoutRef.current) {
      clearTimeout(chatTimeoutRef.current)
    }
    // Hide after 5 seconds of success
    chatTimeoutRef.current = setTimeout(() => {
      setShowChat(false)
    }, 5000)
  }

  const refreshChat = () => {
    console.log('🔄 refreshChat called, current trigger:', chatRefreshTrigger)
    setChatRefreshTrigger(prev => {
      const newTrigger = prev + 1
      console.log('🔄 New refresh trigger:', newTrigger)
      return newTrigger
    })
  }

  const handleClick = () => {
    showChatTemporarily()
  }

  const handleMouseDown = async () => {
    if (!user || !isLoaded) {
      setCommandState(prev => ({ 
        ...prev, 
        error: 'Please sign in to use voice commands' 
      }))
      return
    }

    if (!voiceRecorderRef.current || !voiceCommandClientRef.current) {
      setCommandState(prev => ({ 
        ...prev, 
        error: 'Voice services not available' 
      }))
      return
    }

    setIsPressed(true)
    
    // Create ripple effect
    if (rippleRef.current) {
      const ripple = document.createElement('div')
      ripple.className = 'absolute inset-0 bg-white/30 rounded-full animate-ripple'
      rippleRef.current.appendChild(ripple)
      
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple)
        }
      }, 600)
    }

    // Start recording after hold
    pressTimeoutRef.current = setTimeout(async () => {
      try {
        setCommandState(prev => ({ ...prev, isRecording: true, error: null }))
        await voiceRecorderRef.current?.startRecording()
        // Show chat during recording
        showChatDuringProcessing()
      } catch (error) {
        setCommandState(prev => ({ 
          ...prev, 
          error: `Recording failed: ${error}`, 
          isRecording: false 
        }))
      }
    }, 500)
  }

  const handleMouseUp = async () => {
    setIsPressed(false)
    
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }
    
    if (commandState.isRecording) {
      await stopRecordingAndProcess()
    }
  }

  const handleMouseLeave = () => {
    setIsPressed(false)
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }
  }

  // Handle location request for attendance commands
  const handleLocationRequest = async (commandData: any) => {
    try {
      
      // Request location permission
      const locationResult = await requestLocationPermission({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      });
      
      if (!locationResult.granted) {
        showLocationPermissionMessage(
          locationResult.error || 'Location access is required for attendance',
          locationResult.userDeclined
        );
        return false;
      }
      
      // Execute the attendance command with location
      const response = await fetch(commandData.apiEndpoint, {
        method: commandData.method,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          ...commandData.payload,
          location: locationResult.location
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        
        // Trigger real-time update
        window.dispatchEvent(new CustomEvent('voiceCommandSuccess', {
          detail: {
            action: commandData.action,
            timestamp: new Date().toISOString(),
            userId: user?.id,
            success: true
          }
        }));
        
        return true;
      } else {
        setCommandState(prev => ({ 
          ...prev, 
          error: data.message || 'Attendance command failed',
          isProcessing: false 
        }));
        return false;
      }
    } catch (error) {
      setCommandState(prev => ({ 
        ...prev, 
        error: `Failed to execute attendance command: ${error}`,
        isProcessing: false 
      }));
      return false;
    }
  }

  const stopRecordingAndProcess = async () => {
    try {
      setCommandState(prev => ({ ...prev, isRecording: false, isProcessing: true }))
      // Refresh chat to show processing state
      refreshChat()
      
      // Stop recording
      const recordingResult = await voiceRecorderRef.current?.stopRecording()
      if (!recordingResult) throw new Error('No recording data')
      
      // Process voice command using the client service
      try {
        const result = await voiceCommandClientRef.current?.processVoiceCommand(recordingResult.audioBlob)
        
        if (result) {
          // Check if this is an attendance command that requires location
          if (result.executionResult?.error === 'LOCATION_REQUIRED' && result.executionResult?.data?.requiresClientLocationRequest) {
            
            // Show processing state while requesting location
            setCommandState(prev => ({
              ...prev,
              transcription: result.transcription,
              intent: result.intent,
              success: false,
              error: null,
              nodeProgress: result.nodeStatus?.nodeProgress || [],
              currentNode: result.nodeStatus?.currentNode,
              nodeStatus: result.nodeStatus?.nodeStatus
            }))
            // Refresh chat to show transcription and intent
            refreshChat()
            
            // Request location and execute attendance command
            const locationSuccess = await handleLocationRequest(result.executionResult.data);
            
            if (locationSuccess) {
              setCommandState(prev => ({
                ...prev,
                success: true,
                isProcessing: false,
                nodeProgress: result.nodeStatus?.nodeProgress || [],
                currentNode: result.nodeStatus?.currentNode,
                nodeStatus: result.nodeStatus?.nodeStatus
              }))
              // Refresh chat to show success state
              refreshChat()
              
              // Command is already stored in MongoDB via the API
              
              // Refresh chat and show it
              refreshChat()
              hideChatAfterSuccess()
              
              // Reset after success
              setTimeout(() => {
                setCommandState({
                  isRecording: false,
                  isProcessing: false,
                  transcription: '',
                  intent: null,
                  error: null,
                  success: false,
                  nodeProgress: [],
                  currentNode: undefined,
                  nodeStatus: 'idle'
                })
              }, 3000)
            }
            return; // Exit early for location-required commands
          }
          
          // Handle regular commands (non-attendance or without location requirement)
          setCommandState(prev => ({
            ...prev,
            transcription: result.transcription,
            intent: result.intent,
            success: result.success,
            nodeProgress: result.nodeStatus?.nodeProgress || [],
            currentNode: result.nodeStatus?.currentNode,
            nodeStatus: result.nodeStatus?.nodeStatus
          }))
          // Refresh chat to show transcription, intent, and success state
          refreshChat()

          // Command is already stored in MongoDB via the API

          setCommandState(prev => ({ ...prev, isProcessing: false }))

          // Always refresh chat to load from database, with extra refresh for safety
          refreshChat()

          // Additional refresh for irrelevant messages to ensure data loads
          if (result.intent && (result.intent.intent === 'irrelevant_message' || result.intent === 'irrelevant_message' || String(result.intent).includes('irrelevant'))) {
            setTimeout(() => {
              refreshChat()
            }, 500)
          }

          // Final refresh to ensure chat shows the latest message
          setTimeout(() => {
            refreshChat()
          }, 1000)

          // Delay hiding for irrelevant messages to give time for data to load
          if (result.intent && (result.intent.intent === 'irrelevant_message' || result.intent === 'irrelevant_message' || String(result.intent).includes('irrelevant'))) {
            setTimeout(() => {
              hideChatAfterSuccess()
            }, 3000) // Hide after 3 seconds for irrelevant messages
          } else {
            hideChatAfterSuccess() // Hide after 5 seconds for regular messages
          }
          
          // Reset after success
          setTimeout(() => {
            setCommandState({
              isRecording: false,
              isProcessing: false,
              transcription: '',
              intent: null,
              error: null,
              success: false,
              nodeProgress: [],
              currentNode: undefined,
              nodeStatus: 'idle'
            })
          }, 3000)

          // Handle navigation actions from the command result
          
          // Emit custom event for real-time updates when attendance actions succeed
          // Check if it's a clock_in or clock_out action and execution was successful
          if ((result.intent === 'clock_in' || result.intent === 'clock_out') && 
              result.executionResult?.success !== false) {
            console.log('🔔 Dispatching voiceCommandSuccess event for:', result.intent);
            const event = new CustomEvent('voiceCommandSuccess', {
              detail: {
                action: result.intent,
                timestamp: new Date().toISOString(),
                userId: user?.id,
                success: true
              }
            });
            window.dispatchEvent(event);
          }
          
          // Simplified navigation logic
          let navigationDestination = null;
          
          // Check for navigation in executionResult.data first
          if (result.executionResult?.data?.destination) {
            navigationDestination = result.executionResult.data.destination;
          }
          // Check payload destination as fallback
          else if (result.payload?.destination) {
            navigationDestination = result.payload.destination;
          }
          // Check intent for leave requests (apply_leave or request_leave)
          // Only navigate if the leave application was successful
          else if ((result.intent === 'apply_leave' || result.intent === 'request_leave') &&
                   result.executionResult &&
                   result.executionResult.success !== false) {
            navigationDestination = '/portal/leaves';
          }
          
          // Execute navigation if destination found
          if (navigationDestination) {
            try {
              router.push(navigationDestination);
            } catch (navigationError) {
              console.error('Navigation failed:', navigationError);
              setCommandState(prev => ({ 
                ...prev, 
                error: `Navigation failed: ${navigationError}` 
              }));
            }
          } else {
            console.log('No navigation destination found');
            console.log('Available properties:', Object.keys(result));
            if (result.executionResult) {
              console.log('Execution result properties:', Object.keys(result.executionResult));
            }
          }

        } else {
          throw new Error('No result from voice command processing')
        }
      } catch (processingError) {
        console.error('Voice command processing failed:', processingError)
        setCommandState(prev => ({ 
          ...prev, 
          error: `Processing failed: ${processingError}`, 
          isRecording: false, 
          isProcessing: false 
        }))
      }
      
    } catch (error) {
      console.error('Voice command processing failed:', error)
      setCommandState(prev => ({ 
        ...prev, 
        error: `Processing failed: ${error}`, 
        isRecording: false, 
        isProcessing: false 
      }))
    }
  }

  // Get intent icon based on command type
  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'clock_in':
      case 'clock_out':
        return <ClockIcon className="w-4 h-4" />
      case 'request_leave':
        return <CalendarIcon className="w-4 h-4" />
      case 'show_team_status':
        return <UsersIcon className="w-4 h-4" />
      case 'show_attendance':
      case 'show_profile':
        return <DocumentTextIcon className="w-4 h-4" />
      default:
        return <PlayIcon className="w-4 h-4" />
    }
  }

  // Get intent color based on command type
  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'clock_in':
        return 'text-green-400'
      case 'clock_out':
        return 'text-orange-400'
      case 'request_leave':
        return 'text-blue-400'
      case 'show_team_status':
        return 'text-purple-400'
      case 'show_attendance':
      case 'show_profile':
        return 'text-cyan-400'
      default:
        return 'text-gray-400'
    }
  }

  // Check if voice services are supported
  const isVoiceSupported = typeof window !== 'undefined' && 
    navigator.mediaDevices && 
    typeof navigator.mediaDevices.getUserMedia === 'function' && 
    typeof MediaRecorder !== 'undefined'

  if (!mounted) return null;

  if (!isVoiceSupported) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="w-16 h-16 bg-gray-400 rounded-full shadow-lg cursor-not-allowed"
          disabled
          aria-label="Voice input not supported"
        >
          <MicrophoneIcon className="w-7 h-7 text-white mx-auto" />
        </button>
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg">
          Voice not supported
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-20 pointer-events-none flex items-end space-x-4">
      {/* Voice Command Chat - To the left of mic icon */}
      <div className={`pointer-events-auto transition-all duration-300 ease-in-out transform ${
        showChat 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      }`}>
        <div className="voice-chat-container relative rounded-2xl shadow-2xl p-4 max-w-sm">
          <VoiceCommandChatSimple 
            maxMessages={5} 
            className="text-xs" 
            refreshTrigger={chatRefreshTrigger}
            showProcessingSteps={commandState.isRecording || commandState.isProcessing || commandState.success}
            processingState={{
              isRecording: commandState.isRecording,
              isProcessing: commandState.isProcessing,
              transcription: commandState.transcription,
              intent: commandState.intent?.intent,
              success: commandState.success,
              error: commandState.error,
              nodeProgress: commandState.nodeProgress || [],
              currentNode: commandState.currentNode,
              nodeStatus: commandState.nodeStatus
            }}
          />
        </div>
      </div>
      
      {/* Floating mic button */}
      <button
        className={`
          relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ease-out pointer-events-auto
          ${isPressed 
            ? 'scale-95 shadow-lg' 
            : 'scale-100 hover:scale-105 hover:shadow-xl'
          }
          ${commandState.isRecording || commandState.isProcessing
            ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/50' 
            : commandState.success
            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50'
            : commandState.error
            ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-red-500/50'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/50'
          }
        `}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        aria-label="Voice input"
        disabled={commandState.isProcessing || !user}
      >
        {/* Ripple container */}
        <div ref={rippleRef} className="absolute inset-0 rounded-full overflow-hidden" />
        
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {commandState.isProcessing ? (
            <ArrowPathIcon className="w-7 h-7 text-white animate-spin" />
          ) : commandState.success ? (
            <CheckCircleIcon className="w-7 h-7 text-white" />
          ) : commandState.error ? (
            <XCircleIcon className="w-7 h-7 text-white" />
          ) : commandState.isRecording ? (
            <MicOffIcon className="w-7 h-7 text-white transition-all duration-300" />
          ) : (
            <MicrophoneIcon className="w-7 h-7 text-white transition-all duration-300" />
          )}
        </div>

        {/* Pulse animation when recording */}
        {commandState.isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
            <div className="absolute inset-0 rounded-full bg-red-300 animate-pulse" />
          </>
        )}

        {/* Success pulse animation */}
        {commandState.success && (
          <>
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            <div className="absolute inset-0 rounded-full bg-green-300 animate-pulse" />
          </>
        )}

        {/* Press indicator */}
        <div className={`
          absolute inset-0 rounded-full border-2 border-white/30 transition-all duration-200
          ${isPressed ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}
        `} />
      </button>

      {/* Only show sign-in message if user is not authenticated */}
      {!user && (
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg transition-all duration-300 ease-out whitespace-nowrap max-w-sm opacity-100 translate-y-0">
          <div className="flex items-center gap-2">
            <XCircleIcon className="w-4 h-4 text-red-400" />
            <span>Please sign in to use voice commands</span>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}



    </div>
  )
}

export default MicIcon
