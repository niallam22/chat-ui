const API_URL = process.env.NEXT_PUBLIC_LIGHT_RAG_API_URL

export const transcribeAndEmbed = async (videoUrl: string) => {
  const response = await fetch(`${API_URL}/insert_youtube`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      video_ids: [videoUrl]
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.detail || "Failed to process video")
  }

  return response.json()
}
