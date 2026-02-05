'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PRODUCTS, AGENTS } from '@/lib/constants'
import { CheckCircle2, XCircle, RefreshCw, Plug } from 'lucide-react'

const integrations = [
  { id: 'jira-golance', name: 'Jira (goLance)', type: 'jira', status: 'connected' as const, project: 'GO' },
  { id: 'jira-tf', name: 'Jira (TransForce)', type: 'jira', status: 'connected' as const, project: 'TF' },
  { id: 'slack', name: 'Slack (goLance)', type: 'slack', status: 'connected' as const },
  { id: 'github', name: 'GitHub', type: 'github', status: 'connected' as const },
  { id: 'mixpanel', name: 'Mixpanel', type: 'analytics', status: 'connected' as const },
  { id: 'notion', name: 'Notion', type: 'docs', status: 'error' as const },
  { id: 'composio', name: 'Composio (Gmail)', type: 'email', status: 'connected' as const },
  { id: 'supabase', name: 'Supabase', type: 'database', status: 'connected' as const },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your Mission Control</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products</CardTitle>
            <CardDescription>Your product portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PRODUCTS.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: product.color + '20' }}
                    >
                      {product.emoji}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.shortName}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Squad Members</CardTitle>
            <CardDescription>Your AI agent team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {AGENTS.map((agent) => (
                <div 
                  key={agent.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: agent.color + '20' }}
                    >
                      {agent.emoji}
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.role}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="w-4 h-4" />
              Integrations
            </CardTitle>
            <CardDescription>Connected services and APIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {integrations.map((integration) => (
                <div 
                  key={integration.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{integration.name}</span>
                    {integration.status === 'connected' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {integration.status === 'error' && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary"
                      className={
                        integration.status === 'connected' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }
                    >
                      {integration.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
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
