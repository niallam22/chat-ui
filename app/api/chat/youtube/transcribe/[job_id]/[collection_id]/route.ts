import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { YoutubeTranscribeRes } from "@/lib/services/youtube-rag"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(
  request: Request,
  { params }: { params: { job_id: string; collection_id: string } }
) {
  try {
    const apiKey = process.env.YOUTUBE_TRANSCRIBE_API_KEY
    const baseURL = process.env.YOUTUBE_TRANSCRIBE_URL

    if (!apiKey || !baseURL) {
      return NextResponse.json(
        { message: "Api key and URL are required" },
        { status: 400 }
      )
    }

    // Extract job ID from URL params
    const { job_id, collection_id } = params

    if (!job_id || !collection_id) {
      return NextResponse.json(
        { message: "Job ID and Collection ID are required" },
        { status: 400 }
      )
    }

    //TODO: add db check to see if transcription already complete (first add db field for the rag transcription)
    const url = `${baseURL}/job/${job_id}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": `${apiKey}`
      }
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { message: "Job not found", status: "not_found" },
          { status: 404 }
        )
      }

      const errorData = await res.json()
      throw new Error(errorData.message || "Failed to check job status")
    }

    const responseData = await res.json()
    const status = responseData.status

    switch (status) {
      case "success":
        console.log("Transcription completed successfully")
        console.log("Attempting to post to LLM twin for embedding...")

        // Prepare the base response that we'll return to UI
        const transcriptionResponse = {
          message: "completed",
          data: responseData.data.transcription,
          embedding_status: "pending" // We'll update this based on LLM twin result
        }

        // Try to post to LLM twin, but don't let it block the response
        try {
          const profile = await getServerProfile()
          checkApiKey(profile.llm_twin_api_key, "llm-twin")

          if (!profile.llm_twin_api_key) {
            console.warn("No LLM Twin API key set - skipping embedding")
            transcriptionResponse.embedding_status = "skipped"
            transcriptionResponse.message =
              "completed (embedding skipped - no API key)"
          } else {
            const llmTwinResponse = await fetch(
              `${process.env.LLM_TWIN_URL}/crawl/raw_text`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-API-Key": profile.llm_twin_api_key
                },
                body: JSON.stringify({
                  text: responseData.data.transcription,
                  collection_id: collection_id,
                  user_info: { username: "f_user" },
                  metadata: { source_platform: "chat_ui" }
                })
              }
            )

            if (!llmTwinResponse.ok) {
              const errorText = await llmTwinResponse
                .text()
                .catch(() => "Unknown error")
              console.error(
                `LLM Twin API failed (${llmTwinResponse.status}):`,
                errorText
              )

              // Don't throw - just log and continue
              transcriptionResponse.embedding_status = "failed"
              transcriptionResponse.message = "completed (embedding failed)"
            } else {
              const llmTwinData = await llmTwinResponse.json().catch(() => null)

              if (llmTwinData?.status === 200) {
                console.log("✅ Successfully posted to LLM twin")
                transcriptionResponse.embedding_status = "success"
                transcriptionResponse.message =
                  "completed (embedded successfully)"
              } else {
                console.error("LLM Twin returned non-200 status:", llmTwinData)
                transcriptionResponse.embedding_status = "failed"
                transcriptionResponse.message = "completed (embedding failed)"
              }
            }
          }
        } catch (llmTwinError: any) {
          // Catch any errors from the LLM twin process
          console.error("Error posting to LLM twin:", llmTwinError.message)
          transcriptionResponse.embedding_status = "failed"
          transcriptionResponse.message = "completed (embedding failed)"
        }

        // TODO: Save transcription to db with ref to collection_id and embedding status
        // This should happen regardless of embedding success/failure

        // Always return the transcription data to the UI
        return NextResponse.json<YoutubeTranscribeRes>(transcriptionResponse, {
          status: 200
        })

      case "processing":
        return NextResponse.json<YoutubeTranscribeRes>(
          { message: "processing", data: "No data available" },
          { status: 202 }
        )

      case "error":
        return NextResponse.json<YoutubeTranscribeRes>(
          { message: "error", data: "No data available" },
          { status: 400 }
        )

      default:
        throw new Error("Unexpected status response from transcriber api")
    }
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "YouTube Transcription API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("api key not valid")) {
      errorMessage =
        "YouTube Transcription API Key is incorrect. Please fix it in your profile settings."
    }

    console.error(
      "❌ YouTube transcription route error:",
      errorMessage,
      errorCode
    )

    return NextResponse.json({ message: errorMessage }, { status: errorCode })
  }
}
