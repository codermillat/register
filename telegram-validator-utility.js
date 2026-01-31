#!/usr/bin/env node
/**
 * Telegram Message Validator & Sender Utility
 * 
 * Purpose: Prevent HTTP 400 errors by validating messages before sending to Telegram API
 * 
 * Features:
 * - Pre-validates message length (4096 char limit)
 * - Validates markdown/HTML formatting
 * - Auto-splits long messages
 * - Checks file sizes (10MB photos, 50MB files)
 * - Validates button/keyboard structures
 * - Retry logic with exponential backoff
 * - Detailed error reporting
 * 
 * Usage:
 *   const TelegramValidator = require('./telegram-validator-utility');
 *   const validator = new TelegramValidator(BOT_TOKEN);
 *   await validator.sendMessage(chatId, message, options);
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class TelegramValidator {
  constructor(botToken, options = {}) {
    if (!botToken) {
      throw new Error('Bot token is required');
    }
    
    this.botToken = botToken;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
    
    // Configuration with defaults
    this.config = {
      maxTextLength: options.maxTextLength || 4096,
      maxCaptionLength: options.maxCaptionLength || 1024,
      maxPhotoSize: options.maxPhotoSize || 10 * 1024 * 1024, // 10MB
      maxFileSize: options.maxFileSize || 50 * 1024 * 1024, // 50MB
      maxRetries: options.maxRetries || 3,
      initialRetryDelay: options.initialRetryDelay || 1000,
      chunkOverlap: options.chunkOverlap || 100,
      splitPattern: options.splitPattern || /\n\n|\n|\.(?=\s)|,(?=\s)| /g,
      ...options
    };
    
    this.stats = {
      messagesSent: 0,
      messagesF ailed: 0,
      messagesSplit: 0,
      retries: 0,
      errors: []
    };
  }

  /**
   * Validate and send a text message
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      // Pre-validation
      this.validateChatId(chatId);
      this.validateText(text);
      
      // Check if message needs splitting
      if (text.length > this.config.maxTextLength) {
        return await this.sendLongMessage(chatId, text, options);
      }
      
      // Validate parse mode and formatting
      if (options.parse_mode) {
        this.validateFormatting(text, options.parse_mode);
      }
      
      // Validate inline keyboard if present
      if (options.reply_markup) {
        this.validateReplyMarkup(options.reply_markup);
      }
      
      // Send with retry logic
      const result = await this.sendWithRetry('sendMessage', {
        chat_id: chatId,
        text: text,
        ...options
      });
      
      this.stats.messagesSent++;
      return result;
      
    } catch (error) {
      this.stats.messagesFailed++;
      this.stats.errors.push({
        timestamp: new Date().toISOString(),
        method: 'sendMessage',
        error: error.message,
        chatId,
        textLength: text?.length
      });
      throw new TelegramValidationError(`Failed to send message: ${error.message}`, error);
    }
  }

  /**
   * Split and send long messages
   */
  async sendLongMessage(chatId, text, options = {}) {
    const chunks = this.splitMessage(text);
    this.stats.messagesSplit++;
    
    console.log(`[TelegramValidator] Message too long (${text.length} chars). Splitting into ${chunks.length} parts.`);
    
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkOptions = {
        ...options,
        // Add part indicator
        text: `${chunk}\n\n[Part ${i + 1}/${chunks.length}]`
      };
      
      try {
        const result = await this.sendMessage(chatId, chunk, chunkOptions);
        results.push(result);
        
        // Small delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await this.sleep(100);
        }
      } catch (error) {
        console.error(`[TelegramValidator] Failed to send part ${i + 1}/${chunks.length}:`, error.message);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Intelligently split message into chunks
   */
  splitMessage(text) {
    const maxLength = this.config.maxTextLength - 50; // Reserve space for "[Part X/Y]"
    const chunks = [];
    
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      
      // Find best split point
      let splitPoint = maxLength;
      const substring = remaining.substring(0, maxLength);
      
      // Try to split at paragraph break
      const paragraphBreak = substring.lastIndexOf('\n\n');
      if (paragraphBreak > maxLength * 0.5) {
        splitPoint = paragraphBreak + 2;
      } else {
        // Try to split at line break
        const lineBreak = substring.lastIndexOf('\n');
        if (lineBreak > maxLength * 0.5) {
          splitPoint = lineBreak + 1;
        } else {
          // Try to split at sentence end
          const sentenceEnd = substring.search(/\.\s+(?=[A-Z])/);
          if (sentenceEnd > maxLength * 0.5) {
            splitPoint = sentenceEnd + 2;
          } else {
            // Try to split at word boundary
            const wordBoundary = substring.lastIndexOf(' ');
            if (wordBoundary > maxLength * 0.5) {
              splitPoint = wordBoundary + 1;
            }
          }
        }
      }
      
      chunks.push(remaining.substring(0, splitPoint).trim());
      remaining = remaining.substring(splitPoint).trim();
    }
    
    return chunks;
  }

  /**
   * Send photo with validation
   */
  async sendPhoto(chatId, photo, options = {}) {
    try {
      this.validateChatId(chatId);
      
      // Validate photo size if it's a file path
      if (typeof photo === 'string' && photo.startsWith('/')) {
        this.validateFileSize(photo, this.config.maxPhotoSize, 'Photo');
      }
      
      // Validate caption length
      if (options.caption && options.caption.length > this.config.maxCaptionLength) {
        throw new TelegramValidationError(
          `Caption too long: ${options.caption.length} chars (max: ${this.config.maxCaptionLength})`
        );
      }
      
      // Validate caption formatting
      if (options.caption && options.parse_mode) {
        this.validateFormatting(options.caption, options.parse_mode);
      }
      
      const result = await this.sendWithRetry('sendPhoto', {
        chat_id: chatId,
        photo: photo,
        ...options
      });
      
      this.stats.messagesSent++;
      return result;
      
    } catch (error) {
      this.stats.messagesFailed++;
      this.stats.errors.push({
        timestamp: new Date().toISOString(),
        method: 'sendPhoto',
        error: error.message,
        chatId
      });
      throw new TelegramValidationError(`Failed to send photo: ${error.message}`, error);
    }
  }

  /**
   * Send document with validation
   */
  async sendDocument(chatId, document, options = {}) {
    try {
      this.validateChatId(chatId);
      
      // Validate file size
      if (typeof document === 'string' && document.startsWith('/')) {
        this.validateFileSize(document, this.config.maxFileSize, 'Document');
      }
      
      // Validate caption
      if (options.caption && options.caption.length > this.config.maxCaptionLength) {
        throw new TelegramValidationError(
          `Caption too long: ${options.caption.length} chars (max: ${this.config.maxCaptionLength})`
        );
      }
      
      const result = await this.sendWithRetry('sendDocument', {
        chat_id: chatId,
        document: document,
        ...options
      });
      
      this.stats.messagesSent++;
      return result;
      
    } catch (error) {
      this.stats.messagesFailed++;
      this.stats.errors.push({
        timestamp: new Date().toISOString(),
        method: 'sendDocument',
        error: error.message,
        chatId
      });
      throw new TelegramValidationError(`Failed to send document: ${error.message}`, error);
    }
  }

  /**
   * Validate chat ID
   */
  validateChatId(chatId) {
    if (!chatId) {
      throw new TelegramValidationError('Chat ID is required');
    }
    
    // Chat ID should be a number or string starting with @ for usernames
    if (typeof chatId !== 'number' && typeof chatId !== 'string') {
      throw new TelegramValidationError(`Invalid chat ID type: ${typeof chatId}`);
    }
  }

  /**
   * Validate text message
   */
  validateText(text) {
    if (!text) {
      throw new TelegramValidationError('Message text is required');
    }
    
    if (typeof text !== 'string') {
      throw new TelegramValidationError(`Invalid text type: ${typeof text}`);
    }
    
    if (text.length === 0) {
      throw new TelegramValidationError('Message text cannot be empty');
    }
  }

  /**
   * Validate markdown/HTML formatting
   */
  validateFormatting(text, parseMode) {
    if (parseMode === 'Markdown' || parseMode === 'MarkdownV2') {
      this.validateMarkdown(text, parseMode);
    } else if (parseMode === 'HTML') {
      this.validateHTML(text);
    }
  }

  /**
   * Validate Markdown formatting
   */
  validateMarkdown(text, version = 'Markdown') {
    const issues = [];
    
    if (version === 'MarkdownV2') {
      // MarkdownV2 requires escaping: _*[]()~`>#+-=|{}.!
      const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
      const unescapedChars = [];
      
      for (const char of specialChars) {
        const regex = new RegExp(`(?<!\\\\)\\${char}`, 'g');
        const matches = text.match(regex);
        if (matches) {
          unescapedChars.push({ char, count: matches.length });
        }
      }
      
      if (unescapedChars.length > 0) {
        issues.push(`Unescaped special characters in MarkdownV2: ${unescapedChars.map(c => `${c.char} (${c.count}x)`).join(', ')}`);
      }
    }
    
    // Check for balanced formatting markers
    const boldMatches = (text.match(/\*/g) || []).length;
    const italicMatches = (text.match(/_/g) || []).length;
    const codeMatches = (text.match(/`/g) || []).length;
    
    if (boldMatches % 2 !== 0) {
      issues.push(`Unbalanced bold markers (*): ${boldMatches} found`);
    }
    
    if (italicMatches % 2 !== 0) {
      issues.push(`Unbalanced italic markers (_): ${italicMatches} found`);
    }
    
    if (codeMatches % 2 !== 0) {
      issues.push(`Unbalanced code markers (\`): ${codeMatches} found`);
    }
    
    if (issues.length > 0) {
      console.warn(`[TelegramValidator] Markdown validation warnings:\n${issues.map(i => `  - ${i}`).join('\n')}`);
    }
  }

  /**
   * Validate HTML formatting
   */
  validateHTML(text) {
    const issues = [];
    
    // Allowed tags: b, strong, i, em, u, ins, s, strike, del, code, pre, a
    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'code', 'pre', 'a'];
    
    // Check for unclosed tags
    const tagStack = [];
    const tagRegex = /<\/?(\w+)[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      const [fullTag, tagName] = match;
      
      if (!allowedTags.includes(tagName.toLowerCase())) {
        issues.push(`Unsupported HTML tag: <${tagName}>`);
        continue;
      }
      
      if (fullTag.startsWith('</')) {
        // Closing tag
        if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
          issues.push(`Unmatched closing tag: ${fullTag}`);
        } else {
          tagStack.pop();
        }
      } else if (!fullTag.endsWith('/>')) {
        // Opening tag (not self-closing)
        tagStack.push(tagName);
      }
    }
    
    if (tagStack.length > 0) {
      issues.push(`Unclosed HTML tags: ${tagStack.map(t => `<${t}>`).join(', ')}`);
    }
    
    // Check for unescaped special characters
    const unescapedChars = [];
    if (text.includes('&') && !text.match(/&(?:lt|gt|amp|quot|apos);/)) {
      unescapedChars.push('&');
    }
    if (text.includes('<') && !text.match(/<\/?\w+[^>]*>/)) {
      unescapedChars.push('<');
    }
    if (text.includes('>') && !text.match(/<\/?\w+[^>]*>/)) {
      unescapedChars.push('>');
    }
    
    if (unescapedChars.length > 0) {
      issues.push(`Unescaped HTML characters: ${unescapedChars.join(', ')} (use &lt; &gt; &amp;)`);
    }
    
    if (issues.length > 0) {
      throw new TelegramValidationError(`HTML validation failed:\n${issues.map(i => `  - ${i}`).join('\n')}`);
    }
  }

  /**
   * Validate reply markup (inline keyboard)
   */
  validateReplyMarkup(replyMarkup) {
    if (!replyMarkup.inline_keyboard) {
      return; // Not an inline keyboard, skip validation
    }
    
    const keyboard = replyMarkup.inline_keyboard;
    
    if (!Array.isArray(keyboard)) {
      throw new TelegramValidationError('inline_keyboard must be an array');
    }
    
    if (keyboard.length === 0) {
      throw new TelegramValidationError('inline_keyboard cannot be empty');
    }
    
    // Validate each row
    keyboard.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        throw new TelegramValidationError(`Row ${rowIndex} must be an array`);
      }
      
      if (row.length === 0) {
        throw new TelegramValidationError(`Row ${rowIndex} cannot be empty`);
      }
      
      // Validate each button
      row.forEach((button, buttonIndex) => {
        if (!button.text) {
          throw new TelegramValidationError(`Button at row ${rowIndex}, position ${buttonIndex} must have text`);
        }
        
        // Button must have exactly one of: url, callback_data, switch_inline_query, etc.
        const actionKeys = ['url', 'callback_data', 'switch_inline_query', 'switch_inline_query_current_chat', 'web_app', 'login_url'];
        const hasAction = actionKeys.some(key => button[key] !== undefined);
        
        if (!hasAction) {
          throw new TelegramValidationError(`Button "${button.text}" at row ${rowIndex}, position ${buttonIndex} must have an action (url, callback_data, etc.)`);
        }
        
        // Validate callback_data length (max 64 bytes)
        if (button.callback_data && Buffer.byteLength(button.callback_data, 'utf8') > 64) {
          throw new TelegramValidationError(`Button "${button.text}" callback_data exceeds 64 bytes`);
        }
      });
    });
  }

  /**
   * Validate file size
   */
  validateFileSize(filePath, maxSize, fileType = 'File') {
    if (!fs.existsSync(filePath)) {
      throw new TelegramValidationError(`${fileType} not found: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    const maxSizeMB = maxSize / (1024 * 1024);
    
    if (stats.size > maxSize) {
      throw new TelegramValidationError(
        `${fileType} too large: ${fileSizeMB.toFixed(2)}MB (max: ${maxSizeMB.toFixed(0)}MB)\nFile: ${filePath}`
      );
    }
  }

  /**
   * Send API request with retry logic
   */
  async sendWithRetry(method, params, attempt = 1) {
    try {
      return await this.apiRequest(method, params);
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }
      
      // Check if error is retryable
      const isRetryable = this.isRetryableError(error);
      
      if (!isRetryable) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = this.config.initialRetryDelay * Math.pow(2, attempt - 1);
      
      console.warn(`[TelegramValidator] Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
      this.stats.retries++;
      
      await this.sleep(delay);
      return await this.sendWithRetry(method, params, attempt + 1);
    }
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ];
    
    return retryableCodes.includes(error.statusCode);
  }

  /**
   * Make API request to Telegram
   */
  async apiRequest(method, params) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/${method}`;
      const data = JSON.stringify(params);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };
      
      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            
            if (!response.ok) {
              const error = new Error(response.description || 'Unknown Telegram API error');
              error.statusCode = res.statusCode;
              error.telegramErrorCode = response.error_code;
              error.response = response;
              
              // Enhance error message for HTTP 400
              if (res.statusCode === 400) {
                error.message = `HTTP 400 Bad Request: ${response.description || 'Invalid request'}\n` +
                               `Method: ${method}\n` +
                               `Params: ${JSON.stringify(params, null, 2).substring(0, 500)}...`;
              }
              
              reject(error);
            } else {
              resolve(response.result);
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Telegram API response: ${parseError.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });
      
      req.write(data);
      req.end();
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.messagesSent > 0 
        ? ((this.stats.messagesSent / (this.stats.messagesSent + this.stats.messagesFailed)) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      messagesSent: 0,
      messagesFailed: 0,
      messagesSplit: 0,
      retries: 0,
      errors: []
    };
  }

  /**
   * Export error log
   */
  exportErrorLog(filePath = './telegram-errors.json') {
    fs.writeFileSync(filePath, JSON.stringify(this.stats.errors, null, 2));
    console.log(`[TelegramValidator] Error log exported to ${filePath}`);
  }
}

/**
 * Custom error class for validation errors
 */
class TelegramValidationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'TelegramValidationError';
    this.originalError = originalError;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TelegramValidator, TelegramValidationError };
}

// CLI usage example
if (require.main === module) {
  console.log('Telegram Validator Utility');
  console.log('Usage: const { TelegramValidator } = require("./telegram-validator-utility");');
  console.log('');
  console.log('Example:');
  console.log('  const validator = new TelegramValidator(BOT_TOKEN);');
  console.log('  await validator.sendMessage(chatId, "Hello!", { parse_mode: "Markdown" });');
  console.log('  console.log(validator.getStats());');
}
