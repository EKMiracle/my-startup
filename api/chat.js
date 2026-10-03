export default async function handler(req, res) {
  // Разрешаем только POST-запросы
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = req.body;

    // Проверяем, что сообщение существует
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "No messages provided"
      });
    }

    // Отправляем запрос в OpenAI
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-6-luna",

        instructions: `
You are StudentCV AI — an AI career assistant designed specifically
for students, graduates and young professionals.

Your main purpose is to help users:
- create professional CVs
- improve CV descriptions
- describe education and projects professionally
- present skills and experience clearly
- prepare for job interviews
- write professional cover letters
- understand what recruiters look for
- choose career directions
- improve LinkedIn profiles

Important rules:
- Never invent qualifications, experience, education or achievements.
- If information is missing, ask the user for it.
- Give practical and understandable advice.
- Prefer concise, professional answers.
- When rewriting CV text, make it recruiter-friendly and ATS-friendly.
- Keep the user's original meaning.
- The user may be a student with little or no work experience.
- In that case, help present education, university projects,
  personal projects, skills, volunteering and other relevant experience.
- Be supportive but professional.
- Answer in the same language as the user.
`,

        input: messages.map(message => ({
          role: message.role,
          content: message.content
        }))
      })
    });

    const data = await response.json();

    // Если OpenAI вернул ошибку
    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed"
      });
    }

    // Получаем текст ответа
    return res.status(200).json({
      reply: data.output_text || "Sorry, I couldn't generate a response."
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
