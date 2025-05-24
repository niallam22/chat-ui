import { TranscribeResult } from "@/app/api/chat/youtube/transcribe/route"
import { YoutubeTranscribeRes } from "./types"

export const transcribe = async (
  videoUrl: string
): Promise<TranscribeResult> => {
  const response = await fetch(`/api/chat/youtube/transcribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      videoUrls: [videoUrl]
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.detail || "Failed to process video")
  }
  const resData = await response.json()
  return resData
}

export const embedAndGetTranscription = async (
  job_id: string,
  collection_id: string
): Promise<YoutubeTranscribeRes> => {
  const response = await fetch(
    `/api/chat/youtube/transcribe/${job_id}/${collection_id}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.detail || "Failed to process video")
  }
  const resData = await response.json()
  return resData
}
