import { NextRequest, NextResponse } from 'next/server'
import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'

// Azure Blob Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'npc-images'

// Allowed file types and max size
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Parse connection string to get account name and key
function parseConnectionString(connStr: string): { accountName: string; accountKey: string } | null {
  const accountNameMatch = connStr.match(/AccountName=([^;]+)/)
  const accountKeyMatch = connStr.match(/AccountKey=([^;]+)/)
  
  if (accountNameMatch && accountKeyMatch) {
    return {
      accountName: accountNameMatch[1],
      accountKey: accountKeyMatch[1]
    }
  }
  return null
}

// Generate a SAS URL for a blob that expires in 10 years
function generateSasUrl(
  blobClient: ReturnType<ReturnType<BlobServiceClient['getContainerClient']>['getBlockBlobClient']>,
  accountName: string,
  accountKey: string,
  containerName: string,
  blobName: string
): string {
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  
  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'), // Read only
    startsOn: new Date(),
    expiresOn: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
  }, sharedKeyCredential).toString()
  
  return `${blobClient.url}?${sasToken}`
}

export async function POST(request: NextRequest) {
  try {
    // Check if Azure storage is configured
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Azure Storage not configured' },
        { status: 500 }
      )
    }

    const credentials = parseConnectionString(connectionString)
    if (!credentials) {
      return NextResponse.json(
        { error: 'Invalid Azure Storage connection string' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 500 }
      )
    }

    // Create blob service client
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Ensure container exists (without public access requirement)
    await containerClient.createIfNotExists()

    // Generate unique filename
    const extension = file.name.split('.').pop() || 'png'
    const blobName = `${uuidv4()}.${extension}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    // Convert file to buffer and upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    })

    // Generate a SAS URL for secure access
    const url = generateSasUrl(
      blockBlobClient,
      credentials.accountName,
      credentials.accountKey,
      containerName,
      blobName
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Optional: DELETE endpoint to remove images
export async function DELETE(request: NextRequest) {
  try {
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Azure Storage not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const blobUrl = searchParams.get('url')

    if (!blobUrl) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      )
    }

    // Extract blob name from URL
    const blobName = blobUrl.split('/').pop()
    if (!blobName) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      )
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.deleteIfExists()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
