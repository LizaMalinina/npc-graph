'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraphData, Character, Organisation, GraphLink, Campaign, EntityType, CropSettings } from '@/types'

const API_BASE = '/api'

// ============ CAMPAIGNS ============

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

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; organisationName?: string; imageUrl?: string; imageCrop?: CropSettings }) => {
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

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; imageUrl?: string | null; imageCrop?: CropSettings | null }) => {
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

// ============ CHARACTERS ============

export function useCharacter(id: string | null) {
  return useQuery<Character>({
    queryKey: ['character', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/characters/${id}`)
      if (!res.ok) throw new Error('Failed to fetch character')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateCharacter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<Character>) => {
      const res = await fetch(`${API_BASE}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create character')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Character> }) => {
      const res = await fetch(`${API_BASE}/characters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update character')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/characters/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete character')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// ============ ORGANISATIONS ============

export function useOrganisation(id: string | null) {
  return useQuery<Organisation>({
    queryKey: ['organisation', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/organisations/${id}`)
      if (!res.ok) throw new Error('Failed to fetch organisation')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<Organisation>) => {
      const res = await fetch(`${API_BASE}/organisations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create organisation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

export function useUpdateOrganisation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Organisation> }) => {
      const res = await fetch(`${API_BASE}/organisations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update organisation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

export function useDeleteOrganisation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/organisations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete organisation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// ============ MEMBERSHIPS ============

export function useAddMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ characterId, organisationId }: { characterId: string; organisationId: string }) => {
      const res = await fetch(`${API_BASE}/characters/${characterId}/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisationId }),
      })
      if (!res.ok) throw new Error('Failed to add member to organisation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['characters'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ characterId, organisationId }: { characterId: string; organisationId: string }) => {
      const res = await fetch(`${API_BASE}/characters/${characterId}/memberships/${organisationId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove member from organisation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['characters'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

// ============ RELATIONSHIPS ============

export function useCreateRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      fromEntityId: string
      fromEntityType: EntityType
      toEntityId: string
      toEntityType: EntityType
      type: string
      description?: string
      strength: number
    }) => {
      const res = await fetch(`${API_BASE}/universal-relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create relationship')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-graph'], refetchType: 'active' })
    },
  })
}

export function useUpdateRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GraphLink> }) => {
      const res = await fetch(`${API_BASE}/universal-relationships/${id}`, {
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

export function useDeleteRelationship() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/universal-relationships/${id}`, {
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
