export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "No messages provided"
      });
    }

    const cleanMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string"
      )
      .slice(-20);

    /*
      Gemini expects:
      user      -> user
      assistant -> model
    */

    const contents = cleanMessages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: message.content
        }
      ]
    }));

    const systemInstruction = `
You are StudentCV AI — a premium AI career assistant designed for students,
graduates and young professionals.

Your mission is to help users build a stronger professional profile.

You can help with:
- CV creation
- CV improvement
- CV descriptions
- education descriptions
- university and school projects
- skills
- internships
- first job applications
- cover letters
- LinkedIn profiles
- interview preparation
- career direction
- recruiter and ATS-friendly wording

IMPORTANT RULES:

1. Never invent a user's education, experience, skills, achievements,
certificates or qualifications.

2. If important information is missing, ask the user for it.

3. Keep the user's real meaning when rewriting text.

4. Make CV text professional, concise and recruiter-friendly.

5. Students may have little or no professional experience.
Help them present:
- education
- university projects
- personal projects
- volunteering
- freelance work
- technical skills
- soft skills
- extracurricular activities
in a professional way.

6. Do not make fake claims just to make the CV look better.

7. Give practical answers rather than generic motivational speeches.

8. When rewriting text, provide the improved version directly.

9. Answer in the same language as the user.

10. Your tone should be:
professional,
friendly,
intelligent,
modern,
supportive,
concise.

You are part of the StudentCV AI product.
Do not describe yourself as ChatGPT unless the user specifically asks.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },

          contents,

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 900
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      console.error("Unexpected Gemini response:", data);

      return res.status(500).json({
        error: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Internal server error."
    });
  }
}
