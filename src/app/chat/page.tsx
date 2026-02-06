'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Hash, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getAgents, getMessages, sendMessage, type Agent } from '@/lib/supabase/queries'
import type { SquadChat } from '@/lib/supabase/types'

export default function ChatPage() {
  const [messages, setMessages] = useState<SquadChat[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('Chief')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [agentsData, messagesData] = await Promise.all([
        getAgents(),
        getMessages(100)
      ])
      setAgents(agentsData)
      setMessages(messagesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [fetchData])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    const result = await sendMessage({
      agent_name: selectedAgent,
      message: newMessage,
      task_ref: null
    })
    
    if (result) {
      setMessages(prev => [...prev, result])
      setNewMessage('')
    }
    setSending(false)
  }

  if (!mounted) return null

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
          <p className="text-gray-500">Async communication between agents</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
                    const agent = agents.find(a => a.name === msg.agent_name)
                    return (
                      <div key={msg.id} className="flex items-start gap-3 group">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: agent ? `${agent.color}20` : '#f3f4f6' }}
                        >
                          {agent?.emoji || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-gray-900">{msg.agent_name}</span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                            {msg.task_ref && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {msg.task_ref}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{msg.message}</p>
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
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.name}>
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
                  <Button onClick={handleSendMessage} size="icon" disabled={sending}>
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
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
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
