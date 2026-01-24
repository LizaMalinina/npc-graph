import CampaignBoard from "@/components/detective/CampaignBoard";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { name: true, description: true }
    })
    
    if (campaign) {
      return {
        title: `${campaign.name} - NPC Graph`,
        description: campaign.description || `NPC relationships for ${campaign.name}`,
      }
    }
  } catch (error) {
    console.error('Error fetching campaign for metadata:', error)
  }
  
  return {
    title: 'Campaign - NPC Graph',
    description: 'Manage and visualize NPC relationships',
  }
}

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params
  return <CampaignBoard campaignId={id} />
}
