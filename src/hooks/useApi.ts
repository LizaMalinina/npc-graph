'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraphData, Npc, GraphLink, Crew } from '@/types'

const API_BASE = '/api'

// Fetch graph data
export function useGraphData() {
  return useQuery<GraphData>({
    queryKey: ['graph'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/graph`)
      if (!res.ok) throw new Error('Failed to fetch graph data')
      return res.json()
    },
  })
}

// Fetch all NPCs
export function useNpcs() {
  return useQuery<Npc[]>({
    queryKey: ['npcs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/npcs`)
      if (!res.ok) throw new Error('Failed to fetch NPCs')
      return res.json()
    },
  })
}

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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['npcs'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['npcs'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['npcs'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}

// ============ CREW HOOKS ============

// Fetch all crews
export function useCrews() {
  return useQuery<Crew[]>({
    queryKey: ['crews'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/crews`)
      if (!res.ok) throw new Error('Failed to fetch crews')
      return res.json()
    },
  })
}

// Create Crew
export function useCreateCrew() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<Crew> & { members?: { name: string; title?: string; imageUrl?: string }[] }) => {
      const res = await fetch(`${API_BASE}/crews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create crew')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['crews'] })
    },
  })
}

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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['crews'] })
    },
  })
}

// Delete Crew
export function useDeleteCrew() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/crews/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete crew')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['crews'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['crews'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
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
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}
