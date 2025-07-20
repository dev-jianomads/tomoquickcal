class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async generateResponse(prompt, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 150,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('LLM Service Error:', error);
      throw error;
    }
  }

  async processCalendarRequest(message) {
    const prompt = `
      Parse this calendar request and extract the event details:
      "${message}"
      
      Return a JSON object with the following structure:
      {
        "title": "event title",
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "duration": "duration in minutes",
        "description": "event description"
      }
      
      If any information is missing or unclear, use reasonable defaults or ask for clarification.
    `;

    try {
      const response = await this.generateResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error processing calendar request:', error);
      return {
        error: 'Unable to process calendar request',
        originalMessage: message
      };
    }
  }

  async generateCalendarSuggestion(eventDetails) {
    const prompt = `
      Based on these event details, generate a friendly confirmation message:
      ${JSON.stringify(eventDetails)}
      
      Create a natural, conversational response that confirms the event details
      and asks if the user wants to proceed with creating the calendar event.
    `;

    try {
      return await this.generateResponse(prompt);
    } catch (error) {
      console.error('Error generating calendar suggestion:', error);
      return 'I understand you want to create a calendar event. Would you like me to proceed?';
    }
  }
}

module.exports = LLMService;