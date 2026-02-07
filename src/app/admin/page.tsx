'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'

type UserRole = 'viewer' | 'editor' | 'admin'

interface UserListItem {
  id: string
  email: string | null
  name: string | null
  role: UserRole
  createdAt: string
  _count: {
    editableCampaigns: number
    createdCampaigns: number
  }
}

interface Campaign {
  id: string
  name: string
  slug: string | null
}

interface CampaignEditorInfo {
  assignmentId: string
  id: string
  email: string | null
  name: string | null
  role: UserRole
  assignedAt: string
}

interface CampaignEditorsResponse {
  campaign: { id: string; name: string }
  creator: { id: string; email: string | null; name: string | null; role: UserRole } | null
  editors: CampaignEditorInfo[]
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [assignUserId, setAssignUserId] = useState<string>('')

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<UserListItem[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch users')
      }
      return res.json()
    },
  })

  // Fetch campaigns
  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns')
      if (!res.ok) throw new Error('Failed to fetch campaigns')
      return res.json()
    },
  })

  // Fetch editors for selected campaign
  const { data: campaignEditors, isLoading: editorsLoading } = useQuery<CampaignEditorsResponse>({
    queryKey: ['campaign-editors', selectedCampaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}/editors`)
      if (!res.ok) throw new Error('Failed to fetch campaign editors')
      return res.json()
    },
    enabled: !!selectedCampaignId,
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  // Assign editor mutation
  const assignEditorMutation = useMutation({
    mutationFn: async ({ campaignId, userId }: { campaignId: string; userId: string }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/editors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to assign editor')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-editors', selectedCampaignId] })
      setAssignUserId('')
    },
  })

  // Remove editor mutation
  const removeEditorMutation = useMutation({
    mutationFn: async ({ campaignId, userId }: { campaignId: string; userId: string }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/editors?userId=${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove editor')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-editors', selectedCampaignId] })
    },
  })

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (usersError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold mb-2">Access Denied</h2>
          <p className="text-red-300">
            {usersError instanceof Error ? usersError.message : 'Admin access required'}
          </p>
          <Link href="/" className="text-blue-400 hover:underline mt-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Get editors (non-viewers) for assignment dropdown
  const assignableUsers = users?.filter(u => u.role !== 'viewer') || []

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>

        {/* User Management Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            User Management
          </h2>
          
          <div className="bg-gray-800 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Campaigns</th>
                  <th className="text-left p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="p-3">{user.name || '—'}</td>
                    <td className="p-3 text-gray-400">{user.email || '—'}</td>
                    <td className="p-3">
                      <select
                        value={user.role}
                        onChange={(e) => {
                          updateRoleMutation.mutate({
                            userId: user.id,
                            role: e.target.value as UserRole,
                          })
                        }}
                        disabled={updateRoleMutation.isPending}
                        className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-gray-400">
                      <span title="Created campaigns">
                        {user._count.createdCampaigns} created
                      </span>
                      {' • '}
                      <span title="Assigned campaigns">
                        {user._count.editableCampaigns} assigned
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {updateRoleMutation.isError && (
            <p className="text-red-400 mt-2">
              {updateRoleMutation.error instanceof Error 
                ? updateRoleMutation.error.message 
                : 'Failed to update role'}
            </p>
          )}
        </section>

        {/* Campaign Access Management Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Campaign Access Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campaign selector */}
            <div className="bg-gray-800 rounded-lg p-4">
              <label className="block text-sm text-gray-400 mb-2">Select Campaign</label>
              <select
                value={selectedCampaignId || ''}
                onChange={(e) => setSelectedCampaignId(e.target.value || null)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Choose a campaign...</option>
                {campaigns?.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editors list */}
            {selectedCampaignId && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">
                  {campaignEditors?.campaign.name} - Editors
                </h3>
                
                {editorsLoading ? (
                  <p className="text-gray-400">Loading...</p>
                ) : (
                  <>
                    {/* Creator */}
                    {campaignEditors?.creator && (
                      <div className="mb-3 p-2 bg-gray-700/50 rounded">
                        <span className="text-green-400 text-sm font-medium">Creator:</span>
                        <span className="ml-2">
                          {campaignEditors.creator.name || campaignEditors.creator.email}
                        </span>
                      </div>
                    )}

                    {/* Assigned editors */}
                    <div className="space-y-2 mb-4">
                      {campaignEditors?.editors.length === 0 && (
                        <p className="text-gray-400 text-sm">No editors assigned</p>
                      )}
                      {campaignEditors?.editors.map((editor) => (
                        <div
                          key={editor.assignmentId}
                          className="flex items-center justify-between p-2 bg-gray-700/50 rounded"
                        >
                          <span>{editor.name || editor.email}</span>
                          <button
                            onClick={() =>
                              removeEditorMutation.mutate({
                                campaignId: selectedCampaignId,
                                userId: editor.id,
                              })
                            }
                            disabled={removeEditorMutation.isPending}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add editor form */}
                    <div className="border-t border-gray-700 pt-3">
                      <label className="block text-sm text-gray-400 mb-2">
                        Assign Editor
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={assignUserId}
                          onChange={(e) => setAssignUserId(e.target.value)}
                          className="flex-1 bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select user...</option>
                          {assignableUsers
                            .filter(
                              (u) =>
                                !campaignEditors?.editors.find((e) => e.id === u.id) &&
                                u.id !== campaignEditors?.creator?.id
                            )
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email} ({user.role})
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => {
                            if (assignUserId && selectedCampaignId) {
                              assignEditorMutation.mutate({
                                campaignId: selectedCampaignId,
                                userId: assignUserId,
                              })
                            }
                          }}
                          disabled={!assignUserId || assignEditorMutation.isPending}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {assignEditorMutation.isError && (
                        <p className="text-red-400 text-sm mt-1">
                          {assignEditorMutation.error instanceof Error
                            ? assignEditorMutation.error.message
                            : 'Failed to assign editor'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Permission model info */}
        <section className="mt-8 bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400">
          <h3 className="font-semibold text-gray-300 mb-2">Permission Model</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Viewers</strong> can see all campaigns but cannot edit anything</li>
            <li><strong>Editors</strong> can view all campaigns and create new ones</li>
            <li><strong>Editors</strong> can only edit campaigns they created OR campaigns assigned by an admin</li>
            <li><strong>Admins</strong> can edit all campaigns and manage users</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
