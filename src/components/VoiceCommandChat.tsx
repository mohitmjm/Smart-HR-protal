'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { VoiceCommandClient } from '@/lib/voiceCommandClient'
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

interface VoiceCommandChatProps {
  className?: string
}

const VoiceCommandChat = ({ className = '' }: VoiceCommandChatProps) => {
  const { user, isLoaded } = useUser()
  const [messages, setMessages] = useState<VoiceCommandMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [voiceCommandClient, setVoiceCommandClient] = useState<VoiceCommandClient | null>(null)

  const loadVoiceCommandHistory = useCallback(async () => {
    try {
      setLoading(true)
      
      // Try to get from API first
      const apiResponse = await voiceCommandClient?.getVoiceCommandHistory()
      const apiHistory = (apiResponse as any)?.voiceCommands || apiResponse || []
      
      if (apiHistory && apiHistory.length > 0) {
        const formattedMessages = apiHistory.slice(0, 5).map((cmd: any) => {
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
            timestamp: cmd.recordedAt || cmd.timestamp || new Date().toISOString(),
            transcription: transcription,
            intent: intent,
            action: cmd.action || '',
            success: success,
            message: message,
            data: cmd.executionResult || cmd.data
          }
        }).reverse() // Reverse to show newest messages at bottom
        setMessages(formattedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to load voice command history:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [voiceCommandClient])

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
      case 'irrelevant_message':
        return <ChatBubbleLeftRightIcon className="w-4 h-4" />
      default:
        return <PlayIcon className="w-4 h-4" />
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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center p-4 text-gray-500 ${className}`}>
        <div className="text-center">
          <div className="text-sm">No voice commands yet</div>
          <div className="text-xs text-gray-400 mt-1">Start using voice commands to see them here</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col space-y-2">
          {/* User Message (Left) */}
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-xs">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl rounded-tl-md px-4 py-2 border border-white/30">
                <div className="text-sm text-gray-700">{message.transcription}</div>
                <div className="text-xs text-gray-500 mt-1">{formatTimestamp(message.timestamp)}</div>
              </div>
            </div>
          </div>

          {/* HR Dashboard Response (Right) */}
          <div className="flex justify-end">
            <div className="flex items-start space-x-2 max-w-xs">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl rounded-tr-md px-4 py-2 border border-white/30">
                <div className="flex items-center space-x-2 mb-1">
                  {getIntentIcon(message.intent)}
                  <span className="text-sm font-medium text-gray-700">
                    {message.intent === 'irrelevant_message' ? 'HR Assistant' : message.intent.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${message.success ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
                <div className="text-sm text-gray-700">{message.message}</div>
                <div className="text-xs text-gray-500 mt-1">HR Dashboard</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                H
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default VoiceCommandChat
