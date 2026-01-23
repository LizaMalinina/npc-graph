'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraphData, Npc, GraphLink } from '@/types'

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
