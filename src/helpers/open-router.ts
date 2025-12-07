import OpenAI from "openai";
import envVars from "../config/env";

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: envVars.OPEN_ROUTER_API_KEY,
});
