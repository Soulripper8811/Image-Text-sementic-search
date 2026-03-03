import { NextRequest } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, image } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
      });
    }

    let imageSummary = "";

    // 🔥 STEP 1: If image exists → generate structured summary
    if (image) {
      const visionResult = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
Analyze this image and return structured JSON with:
- main_objects
- environment
- mood
- target_audience
- marketing_angle
`,
              },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 1024,
      });

      imageSummary = visionResult.choices[0]?.message?.content || "";
    }

    // 🔥 STEP 2: Strong Marketing System Prompt
    const marketingSystemPrompt = `
You are a senior marketing strategist and brand communication expert.

Your role:
- Think from a marketing perspective.
- Focus on value proposition and customer psychology.
- Highlight benefits over features.
- Write professionally and persuasively.
- Maintain a premium and polished tone.

Output Rules:
- Provide clean formatting.
- Use structured sections when appropriate.
- Use bullet points only if needed.
- No symbols like || or unnecessary separators.
- No markdown decorations.
- No extra commentary.
- No AI disclaimers.
- Keep it concise but impactful.
- Make content conversion-focused.

If image analysis is provided, incorporate it naturally into the content.
`;

    // 🔥 STEP 3: Inject system + image summary
    const finalMessages = [
      {
        role: "system",
        content: marketingSystemPrompt,
      },
      ...(imageSummary
        ? [
            {
              role: "system",
              content: `Image Analysis:\n${imageSummary}`,
            },
          ]
        : []),
      ...messages,
    ];

    // 🔥 STEP 4: Stream final response
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: finalMessages,
      temperature: 0.9,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: true,
      reasoning_effort: "medium",
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";

          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
    });
  }
}
