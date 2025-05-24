import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"

export const runtime = "edge"

export async function POST(
  request: Request,
  { params }: { params: { collection_id: string } }
) {
  try {
    const reqBody = await request.json()
    const { messages } = reqBody

    const profile = await getServerProfile()
    checkApiKey(profile.llm_twin_api_key, "llm-twin")
    const url = process.env.LLM_TWIN_URL + "/crawl/raw-text"
    if (!profile.llm_twin_api_key || !url) {
      throw new Error("No LLM Twin API key or URL set")
    }
    const collection_id = params.collection_id
    if (!collection_id) {
      throw new Error("No collection_id set")
    }
    const lastMessage = messages.pop()

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": profile.llm_twin_api_key
      },
      body: JSON.stringify({
        query: lastMessage,
        // username: "example",
        collection_id: collection_id,
        user_info: { username: "f_user" },
        metadata: { source_platform: "chat_ui" }
      })
    })

    const resData = await res.json()
    const answerText = resData.answer
    return new Response(answerText, {
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "LLM Twin API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("api key not valid")) {
      errorMessage =
        "LLM Twin API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
