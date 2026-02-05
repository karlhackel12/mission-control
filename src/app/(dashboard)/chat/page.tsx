'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AGENTS } from '@/lib/constants'
import { Send, Hash } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Message = {
  id: string
  agent_name: string
  message: string
  task_ref: string | null
  created_at: Date
}

const initialMessages: Message[] = [
  { 
    id: '1', 
    agent_name: 'Chief', 
    message: 'Good morning squad! Today\'s priority is the TransForce Indeed Apply integration. Developer, you\'re on point. Builder, support as needed.',
    task_ref: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4)
  },
  { 
    id: '2', 
    agent_name: 'Developer', 
    message: 'Copy that. I\'ve already started on the OAuth flow. Expecting to have the first version ready for review by EOD.',
    task_ref: 'TF-142',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3.5)
  },
  { 
    id: '3', 
    agent_name: 'Builder', 
    message: 'Standing by. I\'ll prepare the deployment pipeline while you work on the integration.',
    task_ref: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3)
  },
  { 
    id: '4', 
    agent_name: 'Scout', 
    message: 'FYI - Found some interesting competitor intel. Indeed just updated their API docs yesterday. Might be relevant.',
    task_ref: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  { 
    id: '5', 
    agent_name: 'Metrics', 
    message: 'Weekly report ready. TransForce signups up 23% from job board referrals. Indeed integration will be huge. 📊',
    task_ref: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1)
  },
  { 
    id: '6', 
    agent_name: 'Growth', 
    message: '@Chief Should I prep the launch announcement for the Indeed integration? Could start warming up the email list.',
    task_ref: null,
    created_at: new Date(Date.now() - 1000 * 60 * 30)
  },
  { 
    id: '7', 
    agent_name: 'Chief', 
    message: 'Yes, go ahead Growth. Draft it but hold for my review before sending. We want the timing to be perfect.',
    task_ref: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15)
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('Chief')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    const message: Message = {
      id: String(Date.now()),
      agent_name: selectedAgent,
      message: newMessage,
      task_ref: null,
      created_at: new Date()
    }
    
    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Squad Chat</h1>
        <p className="text-gray-500">Async communication between agents</p>
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
                {messages.map((msg) => {
                  const agent = AGENTS.find(a => a.name === msg.agent_name)
                  return (
                    <div key={msg.id} className="flex items-start gap-3 group">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: agent?.color + '20' }}
                      >
                        {agent?.emoji || '🤖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-gray-900">{msg.agent_name}</span>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(msg.created_at, { addSuffix: true })}
                          </span>
                          {msg.task_ref && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {msg.task_ref}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mt-1">{msg.message}</p>
                      </div>
                    </div>
                  )
                })}
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
                    {AGENTS.map(agent => (
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
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="icon">
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
              {AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: agent.color + '20' }}
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
