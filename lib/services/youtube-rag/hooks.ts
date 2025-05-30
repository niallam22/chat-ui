import { useMutation, useQuery } from "@tanstack/react-query"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { embedAndGetTranscription, transcribe } from "./services"

export const useYoutubeTranscriber = (videoUrl: string) => {
  const {
    mutateAsync: processYoutubeUrl,
    error,
    isPending,
    isSuccess,
    data,
    reset
  } = useMutation({
    mutationFn: () => transcribe(videoUrl),
    onSuccess: data => {
      toast.success("Video is being processed successfully")
    },
    onError: (error: Error) => {
      console.error("YouTube transcription error:", error)
      toast.error(error.message || "Failed to process video")
    }
  })

  return {
    processYoutubeUrl,
    isPending,
    error,
    isSuccess,
    data,
    reset
  }
}

export const useEmbedAndGetTranscription = (
  job_id: string,
  collection_id: string
) => {
  const isTranscriptionCompletedRef = useRef<boolean>(false)
  const { isSuccess, isError, data } = useQuery({
    enabled: !!job_id,
    queryKey: [job_id, collection_id],
    queryFn: () => embedAndGetTranscription(job_id, collection_id)
  })
  useEffect(() => {
    if (data?.message === "completed") {
      isTranscriptionCompletedRef.current = true
    }
  }, [data?.message])
  return { isTranscriptionCompletedRef, isError, data }
}
