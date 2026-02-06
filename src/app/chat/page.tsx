'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Hash } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Id } from '../../../convex/_generated/dataModel'

export default function ChatPage() {
  const [newMessage, setNewMessage] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<Id<"agents"> | null>(null)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Convex queries - real-time updates!
  const agents = useQuery(api.agents.list)
  const messages = useQuery(api.messages.listWithAgents, { limit: 100 })
  
  // Convex mutation
  const sendMessage = useMutation(api.messages.send)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Set default agent when agents load
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgentId) {
      // Find "Chief" agent or use first one
      const chief = agents.find(a => a.name === 'Chief')
      setSelectedAgentId(chief?._id ?? agents[0]._id)
    }
  }, [agents, selectedAgentId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !selectedAgentId) return
    
    setSending(true)
    
    try {
      await sendMessage({
        agentId: selectedAgentId,
        content: newMessage,
        isHuman: false,
        messageType: 'message',
      })
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
    
    setSending(false)
  }

  if (!mounted) return null

  const loading = agents === undefined || messages === undefined

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Squad Chat</h1>
          <p className="text-gray-500">Real-time communication between agents (powered by Convex)</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live updates
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Chat Area */}
        <Card className="col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4" />
              general
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    return (
                      <div 
                        key={msg._id} 
                        className="flex items-start gap-3 group"
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: msg.agent ? `${msg.agent.color}20` : '#f3f4f6' }}
                        >
                          {msg.isHuman ? '👤' : (msg.agent?.emoji || '🤖')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                              {msg.agent?.name || 'Unknown'}
                            </span>
                            {msg.isHuman && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                Human
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </span>
                            {msg.taskRef && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {msg.taskRef}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Send as:</span>
                  <select 
                    value={selectedAgentId || ''}
                    onChange={(e) => setSelectedAgentId(e.target.value as Id<"agents">)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    {agents?.map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.emoji} {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="icon" 
                    disabled={sending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Online Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents?.filter(a => a.isActive).map((agent) => (
                <div key={agent._id} className="flex items-center gap-3">
                  <div className="relative">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      {agent.emoji}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
