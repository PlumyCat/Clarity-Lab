import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  SASProtocol,
} from '@azure/storage-blob';
import { config } from '../config';

export async function uploadPptx(buffer: Buffer, sessionId: string, objectiveLabel?: string): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(config.blobConnectionString);
  const containerClient = blobServiceClient.getContainerClient(config.blobContainer);
  await containerClient.createIfNotExists();

  const now = new Date();
  const date = now.toISOString().slice(0, 10); // 2026-02-13
  const time = now.toTimeString().slice(0, 5).replace(':', 'h'); // 15h30
  const slug = objectiveLabel
    ? objectiveLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    : sessionId.slice(0, 8);
  const blobName = `StormMate-${slug}-${date}-${time}.pptx`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      blobContentDisposition: `attachment; filename="${blobName}"`,
    },
  });

  // Generate SAS URL valid for 7 days
  const sasUrl = await generateSasUrl(blobServiceClient, config.blobContainer, blobName);
  return sasUrl;
}

async function generateSasUrl(
  blobServiceClient: BlobServiceClient,
  containerName: string,
  blobName: string,
): Promise<string> {
  // Extract account name and key from connection string
  const connParts = config.blobConnectionString.split(';');
  const accountName = connParts.find((p) => p.startsWith('AccountName='))?.split('=')[1] ?? '';
  const accountKey = connParts.find((p) => p.startsWith('AccountKey='))?.split('=').slice(1).join('=') ?? '';

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  const expiresOn = new Date();
  expiresOn.setDate(expiresOn.getDate() + 7);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
      protocol: SASProtocol.Https,
    },
    sharedKeyCredential,
  ).toString();

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  return `${blobClient.url}?${sasToken}`;
}
