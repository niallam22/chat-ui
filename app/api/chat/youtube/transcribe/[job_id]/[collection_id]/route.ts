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
        console.log(
          "now we need to post the transcription to llm twin to be embedded"
        )
        const profile = await getServerProfile()

        checkApiKey(profile.llm_twin_api_key, "llm-twin")
        if (!profile.llm_twin_api_key) {
          throw new Error("No LLM Twin API key or URL set")
        }

        const response = await fetch(
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
        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.detail || "Failed to process video")
        }
        const resData = await response.json()

        if (resData.status != 200) {
          throw new Error("Embedding job not accepted")
        }
        // TODO: (optimisation for later) check if embedding is successful so that we dont save doc to db if unsuccessful or we save it with unprocessed status
        // TODO: save transcription to db with ref to collection_id ....

        return NextResponse.json<YoutubeTranscribeRes>(
          { message: "completed", data: responseData.data.transcription },
          { status: 200 }
        )
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
    console.log("ooooooohhh nooooo!!!", errorMessage, errorCode)

    return NextResponse.json({ message: errorMessage }, { status: errorCode })
  }
}
