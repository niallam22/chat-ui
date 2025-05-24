import { NextResponse } from "next/server"

export const runtime = "edge"

interface TranscribeResponse {
  data: { job_id: string }
  status: "accepted"
  message: string
}

interface TranscribeErrorResponse {
  message: string
  status: "error"
}

export type TranscribeResult = TranscribeResponse | TranscribeErrorResponse

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Extract video URLs from request
    const reqBody = await request.json()
    const { videoUrls } = reqBody as { videoUrls: string[] }
    console.log(reqBody)
    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return NextResponse.json<TranscribeResult>(
        { message: "No video URLs provided", status: "error" },
        { status: 400 }
      )
    }

    //TODO: hash vid id and save to db along with collection id and update with data and status through pipeline. check db before processing to avoid duplication
    // Call the transcription service
    const transcription_key = process.env.YOUTUBE_TRANSCRIBE_API_KEY
    const url = process.env.YOUTUBE_TRANSCRIBE_URL + "/transcribe_youtube"
    if (!url || !transcription_key) {
      throw new Error("Transcription API URL not configured")
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": transcription_key
      },
      body: JSON.stringify({
        video_ids: videoUrls
      })
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || "Failed to start transcription job")
    }

    const responseData = await res.json()
    console.log("successful response from youtube transcriber: ", responseData)

    return NextResponse.json<TranscribeResult>(responseData, { status: 202 })
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
    console.log("Transcription error", error)
    return NextResponse.json<TranscribeResult>(
      { message: errorMessage, status: "error" },
      { status: errorCode }
    )
  }
}
