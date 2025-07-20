export class ConversationTracker {
  constructor() {
    this.activeConversations = new Map();
    this.messageBatches = new Map();
    this.batchTimeout = 45000; // 45 seconds
    this.maxBatchSize = 10;
  }

  addMessage(chatId, message, sender, timestamp = Date.now()) {
    // Update conversation state
    this.updateConversationState(chatId, message, sender, timestamp);
    
    // Add to message batch
    this.addToBatch(chatId, { message, sender, timestamp });
    
    return this.getConversationState(chatId);
  }

  updateConversationState(chatId, message, sender, timestamp) {
    const conv = this.activeConversations.get(chatId) || {
      lastCalendarMention: 0,
      lastActivity: 0,
      participants: new Set(),
      messagesSinceCalendar: 0,
      calendarContext: false,
      recentMessages: []
    };
    
    conv.participants.add(sender);
    conv.lastActivity = timestamp;
    conv.messagesSinceCalendar++;
    
    // Keep recent messages for context (last 10)
    conv.recentMessages.push({ message, sender, timestamp });
    if (conv.recentMessages.length > 10) {
      conv.recentMessages.shift();
    }
    
    // Check if this message is calendar-related
    const messageFilter = new (await import('./MessageFilterService.js')).MessageFilterService();
    const filterResult = messageFilter.shouldAnalyzeMessage(message);
    
    if (filterResult.shouldAnalyze) {
      conv.lastCalendarMention = timestamp;
      conv.messagesSinceCalendar = 0;
      conv.calendarContext = true;
    }
    
    // Reset calendar context after 5 minutes of non-calendar activity
    if (timestamp - conv.lastCalendarMention > 5 * 60 * 1000) {
      conv.calendarContext = false;
    }
    
    this.activeConversations.set(chatId, conv);
  }

  addToBatch(chatId, messageData) {
    if (!this.messageBatches.has(chatId)) {
      this.messageBatches.set(chatId, {
        messages: [],
        timer: null,
        lastProcessed: Date.now()
      });
    }
    
    const batch = this.messageBatches.get(chatId);
    batch.messages.push(messageData);
    
    // Clear existing timer
    if (batch.timer) {
      clearTimeout(batch.timer);
    }
    
    // Process immediately if batch is full or message is high-priority
    if (batch.messages.length >= this.maxBatchSize || this.isHighPriority(messageData.message)) {
      this.processBatch(chatId);
    } else {
      // Set timer for batch processing
      batch.timer = setTimeout(() => {
        this.processBatch(chatId);
      }, this.batchTimeout);
    }
  }

  isHighPriority(message) {
    // Immediate processing triggers
    const highPriorityPatterns = [
      /schedule.*meeting/i,
      /book.*appointment/i,
      /zoom.*tomorrow/i,
      /calendar.*invite/i,
      /urgent.*meeting/i,
      /asap/i
    ];
    
    return highPriorityPatterns.some(pattern => pattern.test(message));
  }

  async processBatch(chatId) {
    const batch = this.messageBatches.get(chatId);
    if (!batch || batch.messages.length === 0) return;
    
    console.log(`Processing batch for chat ${chatId}: ${batch.messages.length} messages`);
    
    try {
      // Import LLM service and process the batch
      const { LLMService } = await import('./LLMService.js');
      const llmService = new LLMService();
      
      const conv = this.activeConversations.get(chatId);
      const contextMessages = conv ? conv.recentMessages : [];
      
      await llmService.analyzeConversationBatch(chatId, batch.messages, contextMessages);
      
      // Clear the batch
      batch.messages = [];
      batch.lastProcessed = Date.now();
      
      if (batch.timer) {
        clearTimeout(batch.timer);
        batch.timer = null;
      }
    } catch (error) {
      console.error('Failed to process message batch:', error);
    }
  }

  shouldAnalyzeConversation(chatId) {
    const conv = this.activeConversations.get(chatId);
    if (!conv) return false;
    
    const now = Date.now();
    const recentActivity = now - conv.lastActivity < 2 * 60 * 1000; // 2 minutes
    const hasCalendarContext = conv.calendarContext;
    const notTooManyMessages = conv.messagesSinceCalendar < 15;
    
    return recentActivity && hasCalendarContext && notTooManyMessages;
  }

  getConversationState(chatId) {
    return this.activeConversations.get(chatId) || null;
  }

  cleanupOldConversations() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [chatId, conv] of this.activeConversations.entries()) {
      if (now - conv.lastActivity > maxAge) {
        this.activeConversations.delete(chatId);
        this.messageBatches.delete(chatId);
      }
    }
  }
}