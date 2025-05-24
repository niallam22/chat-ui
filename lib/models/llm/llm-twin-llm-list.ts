import { LLM } from "@/types"

const OPENAI_PLATORM_LINK = "https://platform.openai.com/docs/overview"

const CHITTY_CHATTY_BANG_BANG: LLM = {
  modelId: "chitty-chatty",
  modelName: "Chitty-Chatty-Bang-Bang",
  provider: "llm-twin",
  hostedId: "chitty-chitty",
  platformLink: OPENAI_PLATORM_LINK,
  imageInput: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 5,
    outputCost: 15
  }
}

export const LLM_TWIN_LIST: LLM[] = [CHITTY_CHATTY_BANG_BANG]
