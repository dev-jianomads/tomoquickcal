export class MessageFilterService {
  constructor() {
    this.CALENDAR_KEYWORDS = [
      'meeting', 'call', 'zoom', 'teams', 'schedule', 'appointment',
      'tomorrow', 'today', 'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday', 'pm', 'am', 'calendar', 'book',
      'reschedule', 'cancel', 'invite', 'demo', 'standup', 'sync',
      'catchup', 'coffee', 'lunch', 'dinner', 'conference', 'workshop'
    ];
    
    this.TIME_PATTERN = /\b\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)\b/;
    this.DATE_PATTERN = /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|next\s+week|this\s+week)\b/i;
    this.MENTION_PATTERN = /@\w+/g;
  }

  shouldAnalyzeMessage(message, metadata = {}) {
    // Skip very short messages
    if (message.length < 8) return false;
    
    // Skip obvious non-calendar messages
    if (this.isObviouslyNotCalendar(message)) return false;
    
    const lowerMsg = message.toLowerCase();
    const analysis = {
      hasKeywords: false,
      hasTimePattern: false,
      hasDatePattern: false,
      hasMentions: false,
      score: 0
    };
    
    // Check for calendar keywords
    analysis.hasKeywords = this.CALENDAR_KEYWORDS.some(keyword => 
      lowerMsg.includes(keyword)
    );
    if (analysis.hasKeywords) analysis.score += 3;
    
    // Check for time patterns
    analysis.hasTimePattern = this.TIME_PATTERN.test(message);
    if (analysis.hasTimePattern) analysis.score += 2;
    
    // Check for date patterns
    analysis.hasDatePattern = this.DATE_PATTERN.test(message);
    if (analysis.hasDatePattern) analysis.score += 2;
    
    // Check for mentions (people to invite)
    analysis.hasMentions = this.MENTION_PATTERN.test(message);
    if (analysis.hasMentions) analysis.score += 1;
    
    // Additional scoring for calendar-like phrases
    const calendarPhrases = [
      'let\'s meet', 'can we schedule', 'available for', 'free at',
      'busy at', 'book a', 'set up a', 'plan a', 'organize a'
    ];
    
    const hasCalendarPhrase = calendarPhrases.some(phrase => 
      lowerMsg.includes(phrase)
    );
    if (hasCalendarPhrase) analysis.score += 2;
    
    // Threshold for analysis (score >= 3 means likely calendar-related)
    const shouldAnalyze = analysis.score >= 3;
    
    console.log(`Message analysis: "${message.substring(0, 50)}..." Score: ${analysis.score}, Analyze: ${shouldAnalyze}`);
    
    return {
      shouldAnalyze,
      analysis,
      confidence: Math.min(analysis.score / 5, 1) // Normalize to 0-1
    };
  }

  isObviouslyNotCalendar(message) {
    const lowerMsg = message.toLowerCase();
    
    // Common non-calendar patterns
    const nonCalendarPatterns = [
      /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|lol|haha)$/i,
      /^(👍|👎|😊|😄|❤️|🔥)$/,
      /^(k|kk|sure|cool|nice|great)$/i
    ];
    
    return nonCalendarPatterns.some(pattern => pattern.test(message.trim()));
  }

  preprocessMessage(message) {
    // Clean and normalize message for LLM processing
    return message
      .replace(/[^\w\s@:\/\-\.\,\!\?]/g, ' ') // Keep basic punctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractCalendarHints(message) {
    const hints = {
      times: [],
      dates: [],
      mentions: [],
      keywords: []
    };
    
    // Extract time mentions
    const timeMatches = message.match(/\b\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)\b/g);
    if (timeMatches) hints.times = timeMatches;
    
    // Extract date mentions
    const dateMatches = message.match(this.DATE_PATTERN);
    if (dateMatches) hints.dates = dateMatches;
    
    // Extract mentions
    const mentionMatches = message.match(this.MENTION_PATTERN);
    if (mentionMatches) hints.mentions = mentionMatches;
    
    // Extract calendar keywords found
    const lowerMsg = message.toLowerCase();
    hints.keywords = this.CALENDAR_KEYWORDS.filter(keyword => 
      lowerMsg.includes(keyword)
    );
    
    return hints;
  }
}