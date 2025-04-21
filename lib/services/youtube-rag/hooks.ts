import { useMutation } from "@tanstack/react-query"

import { toast } from "sonner"
import { transcribeAndEmbed } from "./services"

export const useYoutubeProcessor = () => {
  const {
    mutateAsync: processYoutubeUrl,
    error,
    isPending,
    isSuccess
  } = useMutation({
    mutationFn: transcribeAndEmbed,
    onSuccess: data => {
      toast.success("Video processed successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process video")
    }
  })

  return {
    processYoutubeUrl,
    isPending,
    error,
    isSuccess
  }
}
