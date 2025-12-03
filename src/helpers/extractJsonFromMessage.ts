export const extractJsonFromMessage = (message: any) => {
  try {
    const content = message?.content?.trim() || "";

    // Debug log to see what AI actually returned
    // console.log("🔍 AI Raw Response:", content);

    // 1️⃣ Try to extract JSON inside ```json ... ```
    const jsonBlockMatch = content.match(/```json([\s\S]*?)```/);
    if (jsonBlockMatch) {
      const jsonText = jsonBlockMatch[1].trim();
      return JSON.parse(jsonText);
    }

    // 2️⃣ If starts directly with JSON
    if (content.startsWith("{") || content.startsWith("[")) {
      return JSON.parse(content);
    }

    // 3️⃣ Try to find JSON-like substring
    const jsonFallbackMatch = content.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonFallbackMatch) {
      const jsonCandidate = jsonFallbackMatch[1];

      // Try to fix missing closing brackets
      let fixedJson = jsonCandidate;
      if ((fixedJson.match(/\{/g) || []).length !== (fixedJson.match(/\}/g) || []).length) {
        fixedJson += "}";
      }
      if ((fixedJson.match(/\[/g) || []).length !== (fixedJson.match(/\]/g) || []).length) {
        fixedJson += "]";
      }

      return JSON.parse(fixedJson);
    }

    // 4️⃣ No JSON found
    console.warn("⚠️ No valid JSON found in response");
    return [];
  } catch (error: any) {
    console.error("❌ Error parsing AI response:", error.message);
    return [];
  }
};
