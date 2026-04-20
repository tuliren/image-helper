export enum MessageType {
  HeadImage = 'head_image',
  DownloadImage = 'download_image',
}

export interface HeadImageRequest {
  type: MessageType.HeadImage;
  url: string;
}

export interface HeadImageResponse {
  ok: boolean;
  bytes?: number;
  error?: string;
}

export interface DownloadImageRequest {
  type: MessageType.DownloadImage;
  url: string;
  referrer?: string;
}

export interface DownloadImageResponse {
  ok: boolean;
  filename?: string;
  error?: string;
}

export type RequestMessage = HeadImageRequest | DownloadImageRequest;
