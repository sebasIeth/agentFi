const ZERO_G_COMPUTE_ENDPOINT = process.env.ZERO_G_COMPUTE_ENDPOINT || "https://inference-testnet.0g.ai/v1";
const ZERO_G_COMPUTE_MODEL = process.env.ZERO_G_COMPUTE_MODEL || "meta-llama/Llama-4-Scout-17B-16E-Instruct";

export async function generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${ZERO_G_COMPUTE_ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ZERO_G_COMPUTE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`0G Compute error: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  return content.slice(0, 280);
}
