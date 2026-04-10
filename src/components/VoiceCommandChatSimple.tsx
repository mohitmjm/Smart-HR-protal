'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { VoiceCommandClient, NodeExecutionRecord } from '@/lib/voiceCommandClient'
import { ClockIcon, CalendarIcon, UsersIcon, DocumentTextIcon, PlayIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface VoiceCommandMessage {
  id: string
  timestamp: string
  transcription: string
  intent: string
  action: string
  success: boolean
  message: string
  data?: any
}

interface VoiceCommandChatSimpleProps {
  className?: string
  maxMessages?: number
  refreshTrigger?: number // Add refresh trigger prop
  showProcessingSteps?: boolean // Show real-time processing steps
  processingState?: {
    isRecording?: boolean
    isProcessing?: boolean
    transcription?: string
    intent?: string
    action?: string
    success?: boolean
    error?: string | null
    nodeProgress?: NodeExecutionRecord[]
    currentNode?: string
    nodeStatus?: 'idle' | 'running' | 'completed' | 'error' | 'skipped'
  }
}

const VoiceCommandChatSimple = ({ 
  className = 'text-xs', 
  maxMessages = 5,
  refreshTrigger = 0,
  showProcessingSteps = false,
  processingState = {}
}: VoiceCommandChatSimpleProps) => {
  const { user, isLoaded } = useUser()
  const [messages, setMessages] = useState<VoiceCommandMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [voiceCommandClient, setVoiceCommandClient] = useState<VoiceCommandClient | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadVoiceCommandHistory = useCallback(async () => {
    try {
      setLoading(true)
      
      // Force fresh data by adding timestamp
      const timestamp = Date.now()
      console.log(`🔄 Loading voice command history at ${timestamp}`)
      
      // Get from MongoDB API
      const apiResponse = await voiceCommandClient?.getVoiceCommandHistory()
      console.log('📊 Raw API response:', apiResponse);
      const apiHistory = (apiResponse as any)?.voiceCommands || apiResponse || []
      console.log('📊 Processed API history:', apiHistory);
      console.log('📊 API history length:', apiHistory.length);
      
      if (apiHistory && apiHistory.length > 0) {
        const formattedMessages = apiHistory.slice(0, maxMessages).map((cmd: any) => {
          const timestamp = cmd.recordedAt || cmd.timestamp || new Date().toISOString()
          console.log('📅 Raw timestamp from MongoDB:', timestamp, 'Type:', typeof timestamp)

          // Extract message from conversation history if available
          let message = cmd.message || ''
          let intent = cmd.extractedIntent || cmd.intent || ''
          let transcription = cmd.rawTranscribedText || cmd.transcription || ''
          let success = cmd.status === 'completed' || cmd.success || false

          // If conversation history exists, find the proper assistant message
          if (cmd.conversationHistory && cmd.conversationHistory.length > 0) {
            // Look for the first assistant message that contains the actual HR response
            const assistantMessages = cmd.conversationHistory.filter((msg: any) => msg.type === 'assistant')
            for (const assistantMsg of assistantMessages) {
              if (assistantMsg.content &&
                  !assistantMsg.content.includes('Unknown intent completed successfully')) {
                message = assistantMsg.content
                intent = assistantMsg.intent || intent
                success = assistantMsg.executionResult?.success !== false
                break
              }
            }
          }

          // If no proper message found, try execution result
          if (!message && cmd.executionResult?.message) {
            message = cmd.executionResult.message
            intent = cmd.intent || 'irrelevant_message'
            success = cmd.executionResult.success !== false
          }

          return {
            id: cmd._id || cmd.id || Date.now().toString(),
            timestamp: timestamp,
            transcription: transcription,
            intent: intent,
            action: cmd.action || '',
            success: success,
            message: message,
            data: cmd.executionResult || cmd.data
          }
        }).reverse() // Reverse to show newest messages at bottom
        console.log('📊 Formatted messages:', formattedMessages);
        console.log('📊 Setting messages count:', formattedMessages.length);
        setMessages(formattedMessages)
      } else {
        console.log('📊 No voice commands found, setting empty array');
        setMessages([])
      }
    } catch (error) {
      console.error('❌ Failed to load voice command history:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [voiceCommandClient, maxMessages])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVoiceCommandClient(new VoiceCommandClient())
    }
  }, [])

  useEffect(() => {
    if (isLoaded && user && voiceCommandClient) {
      loadVoiceCommandHistory()
    }
  }, [isLoaded, user, voiceCommandClient, loadVoiceCommandHistory])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0 && voiceCommandClient) {
      // Add a small delay to ensure database has been updated
      const timeoutId = setTimeout(() => {
        console.log(`🔄 Refresh triggered: ${refreshTrigger}`)
        console.log(`🔄 Current messages count before refresh: ${messages.length}`)
        loadVoiceCommandHistory()
      }, 1000) // Increased delay to 1 second
      
      return () => clearTimeout(timeoutId)
    }
  }, [refreshTrigger, voiceCommandClient, loadVoiceCommandHistory])

  // Auto-scroll to bottom when messages or processing state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, processingState])

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'clock_in':
      case 'clock_out':
        return <ClockIcon className="w-3 h-3" />
      case 'request_leave':
        return <CalendarIcon className="w-3 h-3" />
      case 'show_team_status':
        return <UsersIcon className="w-3 h-3" />
      case 'show_attendance':
      case 'show_profile':
        return <DocumentTextIcon className="w-3 h-3" />
      case 'irrelevant_message':
        return <ChatBubbleLeftRightIcon className="w-3 h-3" />
      default:
        return <PlayIcon className="w-3 h-3" />
    }
  }

  const formatTimestamp = (timestamp: string | any) => {
    try {
      // Handle MongoDB date format - it might be an object with $date property
      let date: Date
      if (typeof timestamp === 'object' && timestamp && timestamp.$date) {
        // Handle MongoDB date format: {"$date":{"$numberLong":"1758501266988"}}
        if (timestamp.$date.$numberLong) {
          date = new Date(parseInt(timestamp.$date.$numberLong))
        } else {
          date = new Date(timestamp.$date)
        }
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else {
        date = new Date()
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60)
        return `${diffInMinutes}m ago`
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`
      } else {
        return date.toLocaleDateString()
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp)
      return 'Invalid date'
    }
  }

  const getUserName = () => {
    if (!user) return 'User'
    return user.firstName || user.fullName?.split(' ')[0] || 'User'
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gradient-to-r from-blue-400 to-purple-500 shadow-lg shadow-blue-400/50"></div>
        <span className="ml-2 text-xs text-white font-medium drop-shadow-sm">Loading...</span>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center p-4 text-gray-300 ${className}`}>
        <div className="text-center">
          <div className="text-xs font-semibold text-white drop-shadow-sm">Voice Commands</div>
          <div className="text-xs text-white/60 mt-1 drop-shadow-sm">No recent commands</div>
        </div>
      </div>
    )
  }

  // Render processing steps if enabled
  const renderProcessingSteps = () => {
    if (!showProcessingSteps) return null

    // Node status mapping for better UI display
    const getNodeDisplayName = (nodeId: string) => {
      switch (nodeId) {
        case 'intent_extraction': return 'Extracting Intent'
        case 'intent_continuity': return 'Checking Intent Continuity'
        case 'data_collection': return 'Checking Required Data'
        case 'information_completion': return 'Normalizing Information'
        case 'execution': return 'Executing Command'
        case 'confirmation': return 'Generating Response'
        default: return nodeId.replace('_', ' ').toUpperCase()
      }
    }

    const getNodeStatusColor = (status: string) => {
      switch (status) {
        case 'running': return 'text-blue-400'
        case 'completed': return 'text-green-400'
        case 'error': return 'text-red-400'
        case 'skipped': return 'text-gray-400'
        default: return 'text-gray-400'
      }
    }

    const getNodeStatusIcon = (status: string) => {
      switch (status) {
        case 'running': return 'bg-blue-400 animate-pulse'
        case 'completed': return 'bg-green-400'
        case 'error': return 'bg-red-400'
        case 'skipped': return 'bg-gray-400'
        default: return 'bg-gray-400'
      }
    }

    return (
      <div className="voice-chat-message space-y-2 mb-4 p-3 rounded-lg">
        <div className="text-xs font-semibold text-blue-300 mb-2">Processing Voice Command...</div>

        {/* Node-level status updates */}
        {processingState.nodeProgress && processingState.nodeProgress.map((node, index) => (
          <div key={`${node.nodeId}-${index}`} className={`flex items-center space-x-2 text-xs ${getNodeStatusColor(node.status)}`}>
            <div className={`w-2 h-2 rounded-full ${getNodeStatusIcon(node.status)}`}></div>
            <span>{getNodeDisplayName(node.nodeId)} {node.status === 'running' ? '...' : node.status === 'completed' ? '✓' : node.status === 'error' ? '✗' : ''}</span>
            {node.duration && (
              <span className="text-xs text-gray-500">({node.duration}ms)</span>
            )}
          </div>
        ))}

        {/* Legacy processing steps (fallback) */}
        {!processingState.nodeProgress && (
          <>
            {/* Recording Step */}
            <div className={`flex items-center space-x-2 text-xs ${processingState.isRecording ? 'text-red-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${processingState.isRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`}></div>
              <span>Recording audio...</span>
            </div>

            {/* Transcription Step */}
            {processingState.transcription && (
              <div className="flex items-center space-x-2 text-xs text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>Transcribing: "{processingState.transcription}"</span>
              </div>
            )}

            {/* Categorizing Step */}
            {processingState.isProcessing && processingState.transcription && !processingState.intent && (
              <div className="flex items-center space-x-2 text-xs text-yellow-400">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                <span>Categorizing command...</span>
              </div>
            )}

            {/* Intent Identified Step */}
            {processingState.intent && (
              <div className="flex items-center space-x-2 text-xs text-purple-400">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span>Intent: {processingState.intent.replace('_', ' ').toUpperCase()}</span>
              </div>
            )}

            {/* Taking Action Step */}
            {processingState.isProcessing && processingState.intent && !processingState.success && !processingState.error && (
              <div className="flex items-center space-x-2 text-xs text-orange-400">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                <span>Taking action...</span>
              </div>
            )}

            {/* Success Step */}
            {processingState.success && (
              <div className="flex items-center space-x-2 text-xs text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>Action completed successfully!</span>
              </div>
            )}

            {/* Error Step */}
            {processingState.error && (
              <div className="flex items-center space-x-2 text-xs text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span>Error: {processingState.error}</span>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent ${className}`} ref={scrollRef}>
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col space-y-1">
          {/* User Message (Left) */}
          <div className="flex justify-start">
            <div className="flex items-start space-x-1 max-w-xs">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-semibold border border-white/20 shadow-lg">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div className="voice-chat-message rounded-lg rounded-tl-sm px-3 py-2">
                <div className="text-xs text-gray-800 font-medium drop-shadow-sm">{message.transcription}</div>
                <div className="text-xs text-gray-600 mt-1 drop-shadow-sm">{formatTimestamp(message.timestamp)}</div>
              </div>
            </div>
          </div>

          {/* Tielo Response (Right) */}
          <div className="flex justify-end">
            <div className="flex items-start space-x-1 max-w-xs">
              <div className="voice-chat-message rounded-lg rounded-tr-sm px-3 py-2">
                <div className="flex items-center space-x-1 mb-1">
                  {getIntentIcon(message.intent)}
                  <span className="text-xs font-medium text-gray-800 drop-shadow-sm">
                    {message.intent === 'irrelevant_message' ? 'HR Assistant' : message.intent.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${message.success ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'}`}></div>
                </div>
                <div className="text-xs text-gray-800 font-medium drop-shadow-sm">{message.message}</div>
                <div className="text-xs text-gray-600 mt-1 drop-shadow-sm">Tielo</div>
              </div>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-500/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-semibold border border-white/20 shadow-lg">
                T
              </div>
            </div>
          </div>
        </div>
      ))}
      {renderProcessingSteps()}
    </div>
  )
}

export default VoiceCommandChatSimple
