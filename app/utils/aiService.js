const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const axios = require('axios');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/**
 * Extract information from document using GPT-4
 * @param {string} filePath - Path to document file (PDF/image)
 * @returns {Promise<Object>} - Extracted information
 */
const extractDocumentInfo = async (filePath) => {
  try {
    // Get file extension
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Read file as base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64File = fileBuffer.toString('base64');
    
    // Determine content type
    let contentType;
    if (['.png', '.jpg', '.jpeg'].includes(fileExt)) {
      contentType = `image/${fileExt.slice(1)}`;
    } else if (fileExt === '.pdf') {
      contentType = 'application/pdf';
    } else {
      throw new Error(`Unsupported file type: ${fileExt}`);
    }
    
    // Instead of using vision model, use base64 encoding description
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Use current GPT-4 model
      messages: [
        {
          role: "system", 
          content: "You are an expert document analyzer. Extract relevant information from the document description provided."
        },
        {
          role: "user",
          content: `This is a base64 encoded ${contentType} file of an event/leave document. 
          Based on the file name and any context I can provide, extract the following information in JSON format:
          1. Event name/title (infer from filename if needed)
          2. Student name (if available in filename)  
          3. Event date(s) (infer a reasonable date range based on current date)
          4. Organization/institution name (use "Unknown" if not available)
          5. Document type (certificate, invitation, etc.)
          
          File name: ${path.basename(filePath)}
          Return ONLY valid JSON without explanation.`
        }
      ],
      max_tokens: 800
    });
    
    // Parse JSON response
    const jsonText = response.choices[0].message.content.trim();
    try {
      // Extract JSON from the response if it contains explanatory text
      const jsonMatch = jsonText.match(/```json\n([\s\S]*)\n```/) 
        || jsonText.match(/```([\s\S]*)```/) 
        || jsonText.match(/{[\s\S]*}/);
      
      const cleanJson = jsonMatch ? jsonMatch[1] || jsonMatch[0] : jsonText;
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      console.error('Raw response:', jsonText);
      throw new Error('Failed to parse document information');
    }
  } catch (error) {
    console.error('Error extracting document info:', error);
    throw new Error('Failed to extract information from document');
  }
};

/**
 * Verify event information by searching the web
 * @param {Object} extractedInfo - Information extracted from document
 * @param {Object} studentData - Known student data
 * @param {Object} eventData - Known event data (if applicable)
 * @returns {Promise<Object>} - Verification result with confidence score
 */
const verifyDocumentInfo = async (extractedInfo, studentData, eventData = null) => {
  try {
    // Extract the event name and organization
    const eventName = extractedInfo.eventName || extractedInfo['Event name/title'];
    const organization = extractedInfo.organization || extractedInfo['Organization/institution name'];
    
    // Prepare search query
    const searchQuery = `${eventName} ${organization} event`;
    
    // Web search (simplified mock implementation - in a real app, use a search API)
    let searchResults = [];
    try {
      // Use a general search API or educational events database API here
      // This is a placeholder - in a real implementation, use a proper search API
      const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
        params: {
          key: process.env.GOOGLE_API_KEY || 'YOUR_API_KEY',
          cx: process.env.GOOGLE_CSE_ID || 'YOUR_SEARCH_ENGINE_ID',
          q: searchQuery
        }
      });
      
      if (response.data && response.data.items) {
        searchResults = response.data.items.map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }));
      }
    } catch (error) {
      console.error('Error performing web search:', error);
      // Continue with empty search results
    }
    
    // Check for suspicious patterns in event name
    const suspiciousPatterns = [
      "fake conference", "made up event", "non-existent", "fictional", 
      "diploma mill", "unaccredited", "nonexistent", "imaginary event",
      "false certificate", "fraudulent", "fake certificate"
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      eventName.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Use GPT to evaluate the search results
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Use current GPT-4 model
      messages: [
        {
          role: "system",
          content: "You are an event verification expert. Your job is to determine if an event is legitimate based on available information. You should be skeptical of events that can't be confirmed through reliable sources. Be especially cautious about events that might be fabricated for the purpose of obtaining leave approval."
        },
        {
          role: "user",
          content: `Verify if the event "${eventName}" at "${organization}" exists based on:
          
          1. Extracted information from document:
          ${JSON.stringify(extractedInfo)}
          
          2. Student data:
          ${JSON.stringify(studentData)}
          
          ${eventData ? `3. Known event data:\n${JSON.stringify(eventData)}` : ''}
          
          ${searchResults.length > 0 ? `4. Search results:\n${JSON.stringify(searchResults)}` : '4. No search results found'}
          
          ${hasSuspiciousPattern ? '⚠️ Warning: The event name contains suspicious patterns that may indicate a fraudulent event.' : ''}
          
          Even if search results are empty, make your best judgment based on the event name, organization, and other factors.
          
          Calculate a confidence score (0-100) based on your evaluation.
          Return JSON with the following fields:
          - verified: boolean (true if confidence >= 70)
          - confidence: number (0-100)
          - reasoning: string (brief explanation of your verification decision)
          - recommendedAction: string (one of: "approve", "request_more_info", "reject")
            - Use "approve" only if you're highly confident (80%+) the event is legitimate
            - Use "request_more_info" if you're uncertain but the event seems plausible
            - Use "reject" if you have strong evidence the event might be fabricated
          
          Return ONLY valid JSON without explanation.`
        }
      ],
      max_tokens: 800
    });
    
    // Parse JSON response
    const jsonText = response.choices[0].message.content.trim();
    try {
      // Extract JSON from the response if it contains explanatory text
      const jsonMatch = jsonText.match(/```json\n([\s\S]*)\n```/) 
        || jsonText.match(/```([\s\S]*)```/) 
        || jsonText.match(/{[\s\S]*}/);
      
      const cleanJson = jsonMatch ? jsonMatch[1] || jsonMatch[0] : jsonText;
      const result = JSON.parse(cleanJson);
      
      // Add additional safety checks
      if (hasSuspiciousPattern && result.confidence > 50) {
        result.confidence = Math.min(result.confidence, 50);
        result.reasoning = `${result.reasoning} Note: Suspicious patterns detected in event name.`;
        if (result.recommendedAction === 'approve') {
          result.recommendedAction = 'request_more_info';
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing verification response:', error);
      console.error('Raw response:', jsonText);
      throw new Error('Failed to parse verification result');
    }
  } catch (error) {
    console.error('Error verifying document info:', error);
    throw new Error('Failed to verify document information');
  }
};

module.exports = {
  extractDocumentInfo,
  verifyDocumentInfo
}; 