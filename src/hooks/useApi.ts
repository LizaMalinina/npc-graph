'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraphData, Npc, GraphLink, Crew, Campaign } from '@/types'

const API_BASE = '/api'

// ============ CAMPAIGNS ============

// Fetch all campaigns
export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/campaigns`)
      if (!res.ok) throw new Error('Failed to fetch campaigns')
      return res.json()
    },
  })
}

// Fetch single campaign
export function useCampaign(id: string) {
  return useQuery<Campaign>({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/campaigns/${id}`)
      if (!res.ok) throw new Error('Failed to fetch campaign')
      return res.json()
    },
    enabled: !!id,
  })
}

// Create campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; crewName?: string; imageUrl?: string }) => {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create campaign')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// Delete campaign
export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete campaign')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'], refetchType: 'active' })
    },
  })
}

// Update campaign
export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; imageUrl?: string | null }) => {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update campaign')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'], refetchType: 'active' })
    },
  })
}

// Fetch graph data for a campaign
export function useCampaignGraphData(campaignId: string) {
  return useQuery<GraphData & { campaign: { id: string; name: string; description?: string } }>({
    queryKey: ['campaign-graph', campaignId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/graph`)
      if (!res.ok) throw new Error('Failed to fetch campaign graph data')
      return res.json()
    },
    enabled: !!campaignId,
  })
}

// ============ NPCs ============

// Fetch single NPC
export function useNpc(id: string | null) {
  return useQuery<Npc>({
    queryKey: ['npc', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/npcs/${id}`)
      if (!res.ok) throw new Error('Failed to fetch NPC')
      return res.json()
    },
    enabled: !!id,
  })
}

// Create NPC
export function useCreateNpc() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<Npc>) => {
      const res = await fetch(`${API_BASE}/npcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create NPC')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npcs'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Update NPC
export function useUpdateNpc() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Npc> }) => {
      const res = await fetch(`${API_BASE}/npcs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update NPC')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npcs'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Delete NPC
export function useDeleteNpc() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/npcs/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete NPC')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npcs'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Create Relationship
export function useCreateRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      fromNpcId: string
      toNpcId: string
      type: string
      description?: string
      strength: number
    }) => {
      const res = await fetch(`${API_BASE}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Update Relationship
export function useUpdateRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GraphLink> }) => {
      const res = await fetch(`${API_BASE}/relationships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Delete Relationship
export function useDeleteRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/relationships/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// ============ CREW HOOKS ============

// Update Crew
export function useUpdateCrew() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Crew> }) => {
      const res = await fetch(`${API_BASE}/crews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update crew')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Add Crew Member
export function useAddCrewMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ crewId, data }: { crewId: string; data: { name: string; title?: string; imageUrl?: string; description?: string } }) => {
      const res = await fetch(`${API_BASE}/crews/${crewId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add crew member')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaigns'], refetchType: 'active' })
    },
  })
}

// Update Crew Member
export function useUpdateCrewMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; title?: string; imageUrl?: string; description?: string } }) => {
      const res = await fetch(`${API_BASE}/crew-members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update crew member')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaigns'], refetchType: 'active' })
    },
  })
}

// Delete Crew Member
export function useDeleteCrewMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/crew-members/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete crew member')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaigns'], refetchType: 'active' })
    },
  })
}

// Create Crew Relationship (crew to NPC)
export function useCreateCrewRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { crewId: string; toNpcId: string; type: string; description?: string; strength?: number }) => {
      const res = await fetch(`${API_BASE}/crew-relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create crew relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Delete Crew Relationship
export function useDeleteCrewRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/crew-relationships?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete crew relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Update Crew Relationship
export function useUpdateCrewRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { type: string; description?: string; strength: number } }) => {
      const res = await fetch(`${API_BASE}/crew-relationships?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update crew relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Create Crew Member Relationship (crew member to NPC)
export function useCreateCrewMemberRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { crewMemberId: string; toNpcId: string; type: string; description?: string; strength?: number }) => {
      const res = await fetch(`${API_BASE}/crew-member-relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create crew member relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Delete Crew Member Relationship
export function useDeleteCrewMemberRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/crew-member-relationships?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete crew member relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// Update Crew Member Relationship
export function useUpdateCrewMemberRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { type: string; description?: string; strength: number } }) => {
      const res = await fetch(`${API_BASE}/crew-member-relationships?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update crew member relationship')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

