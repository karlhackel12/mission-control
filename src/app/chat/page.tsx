'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Hash, RefreshCw, MessageCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getAgents, getMessages, sendMessage, getPendingDiscussionPrompts, respondToDiscussionPrompt, type Agent } from '@/lib/supabase/queries'
import type { SquadChat, DiscussionPrompt } from '@/lib/supabase/types'

type SquadChatWithType = SquadChat & {
  discussion_prompt_id?: string | null
  message_type?: 'message' | 'discussion_prompt' | 'discussion_response' | 'system'
}

export default function ChatPage() {
  const [messages, setMessages] = useState<SquadChatWithType[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [pendingPrompts, setPendingPrompts] = useState<DiscussionPrompt[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('Chief')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [agentsData, messagesData, promptsData] = await Promise.all([
        getAgents(),
        getMessages(100),
        getPendingDiscussionPrompts()
      ])
      setAgents(agentsData)
      setMessages(messagesData as SquadChatWithType[])
      setPendingPrompts(promptsData)
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
    
    let result: SquadChat | null = null
    
    if (replyingTo) {
      // Responding to a discussion prompt
      result = await respondToDiscussionPrompt(replyingTo, {
        agent_name: selectedAgent,
        message: newMessage,
        is_human: false
      })
      setReplyingTo(null)
    } else {
      // Regular message
      result = await sendMessage({
        agent_name: selectedAgent,
        message: newMessage,
        task_ref: null
      })
    }
    
    if (result) {
      setMessages(prev => [...prev, result as SquadChatWithType])
      setNewMessage('')
      // Refresh to get updated prompt status
      fetchData()
    }
    setSending(false)
  }
  
  const handleReplyToPrompt = (promptId: string) => {
    setReplyingTo(promptId)
    // Focus the input
    const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement
    input?.focus()
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
                    const isDiscussionPrompt = msg.message_type === 'discussion_prompt'
                    const isDiscussionResponse = msg.message_type === 'discussion_response'
                    const prompt = isDiscussionPrompt ? pendingPrompts.find(p => p.squad_chat_id === msg.id) : null
                    const responseCount = prompt?.collected_context?.length || 0
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex items-start gap-3 group ${
                          isDiscussionPrompt ? 'bg-amber-50 border border-amber-200 rounded-lg p-3 -mx-1' : ''
                        } ${
                          isDiscussionResponse ? 'pl-8 border-l-2 border-blue-200 ml-4' : ''
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: agent ? `${agent.color}20` : '#f3f4f6' }}
                        >
                          {agent?.emoji || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{msg.agent_name}</span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                            {msg.task_ref && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {msg.task_ref}
                              </span>
                            )}
                            {isDiscussionPrompt && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                Discussion Prompt
                              </span>
                            )}
                            {isDiscussionResponse && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Response
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{msg.message}</p>
                          
                          {/* Discussion Prompt Status & Actions */}
                          {isDiscussionPrompt && prompt && (
                            <div className="mt-3 flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-500">
                                {prompt.status === 'collecting' ? (
                                  <Clock className="w-4 h-4 text-amber-500" />
                                ) : prompt.status === 'resolved' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>
                                  {responseCount}/{prompt.required_responses} responses
                                </span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">
                                Timeout: {prompt.timeout_minutes}min
                              </span>
                              {prompt.status === 'collecting' && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReplyToPrompt(prompt.id)}
                                    className="h-7 text-xs"
                                  >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    Reply
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
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
              {/* Reply indicator */}
              {replyingTo && (
                <div className="mb-2 flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">
                  <MessageCircle className="w-4 h-4" />
                  <span>Replying to discussion prompt</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto h-6 text-amber-600 hover:text-amber-800"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
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
                    placeholder={replyingTo ? "Type your response to the discussion..." : "Type a message..."}
                    className={`flex-1 ${replyingTo ? 'border-amber-300 focus:ring-amber-500' : ''}`}
                    disabled={sending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="icon" 
                    disabled={sending}
                    className={replyingTo ? 'bg-amber-500 hover:bg-amber-600' : ''}
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
