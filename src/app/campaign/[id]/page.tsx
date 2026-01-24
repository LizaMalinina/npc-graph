import CampaignBoard from "@/components/detective/CampaignBoard";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params
  return <CampaignBoard campaignId={id} />
}
