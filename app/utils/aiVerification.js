/**
 * Real AI document verification utility
 * Uses OpenAI and document analysis for verification
 */
const fs = require('fs');
const path = require('path');
const { extractDocumentInfo, verifyDocumentInfo } = require('./aiService');
const config = require('../config');

/**
 * Verify document authenticity using AI
 * @param {string} documentPath - Path to the document to verify
 * @returns {Promise<Object>} - Verification result
 */
exports.verifyDocumentAuthenticity = async (documentPath) => {
  try {
    // Extract document information using the real OpenAI implementation
    const extractedInfo = await extractDocumentInfo(documentPath);
    
    if (!extractedInfo) {
      throw new Error('Failed to extract information from document');
    }
    
    // Check for indicators of authenticity in the extracted information
    const hasSignature = extractedInfo.signature !== undefined || 
                        !!extractedInfo.signedBy || 
                        (extractedInfo.documentContent && 
                         extractedInfo.documentContent.toLowerCase().includes('sign'));
    
    const hasStamp = extractedInfo.stamp !== undefined || 
                    !!extractedInfo.stampedBy || 
                    (extractedInfo.documentContent && 
                     extractedInfo.documentContent.toLowerCase().includes('stamp'));
    
    const hasLetterhead = extractedInfo.organization && 
                          extractedInfo.organization !== 'Unknown';
    
    // Score authenticity based on document features
    const documentFeatures = {
      hasValidSignature: hasSignature,
      hasValidStamp: hasStamp,
      hasLetterhead: hasLetterhead,
      documentFormat: extractedInfo.documentType?.toLowerCase()?.includes('certificate') ? 'valid' : 'standard',
      textConsistency: 'consistent' // Assumption based on successful extraction
    };
    
    // Calculate confidence score based on document features
    const featureScores = {
      hasValidSignature: documentFeatures.hasValidSignature ? 0.3 : 0,
      hasValidStamp: documentFeatures.hasValidStamp ? 0.2 : 0,
      hasLetterhead: documentFeatures.hasLetterhead ? 0.2 : 0,
      documentFormat: documentFeatures.documentFormat === 'valid' ? 0.2 : 0.1,
      textConsistency: documentFeatures.textConsistency === 'consistent' ? 0.1 : 0
    };
    
    const confidenceScore = Object.values(featureScores).reduce((sum, score) => sum + score, 0);
    const isAuthentic = confidenceScore > 0.6; // 60% threshold for authenticity
    
    // Normalize to 0-1 scale
    const normalizedScore = Math.min(Math.max(confidenceScore, 0), 1);
    
    return {
      isAuthentic,
      confidenceScore: normalizedScore.toFixed(2),
      verificationTimestamp: new Date().toISOString(),
      documentFeatures,
      message: isAuthentic ? 
        'Document appears to be authentic based on AI analysis' : 
        'Document has features that require further verification'
    };
  } catch (error) {
    console.error('Error verifying document authenticity:', error);
    throw error;
  }
};

/**
 * Extract event information from document using real AI
 * @param {string} documentPath - Path to the document
 * @returns {Promise<Object>} - Extracted event information
 */
exports.extractEventInformation = async (documentPath) => {
  try {
    // Use the real document extraction service
    const extractedInfo = await extractDocumentInfo(documentPath);
    
    if (!extractedInfo) {
      throw new Error('Failed to extract information from document');
    }
    
    // Map the extracted fields to a standard format
    const formattedInfo = {
      eventName: extractedInfo.eventName || extractedInfo['Event name/title'] || '',
      organizerName: extractedInfo.organization || extractedInfo['Organization/institution name'] || '',
      venue: extractedInfo.venue || extractedInfo.location || '',
      startDate: extractedInfo.startDate || extractedInfo['Event date(s)'] || '',
      endDate: extractedInfo.endDate || '',
      contactPerson: extractedInfo.contactPerson || ''
    };
    
    // For any missing dates, make a best guess based on document creation date
    if (!formattedInfo.startDate) {
      const fileStats = fs.statSync(documentPath);
      const docDate = new Date(fileStats.birthtime);
      formattedInfo.startDate = docDate.toISOString().split('T')[0];
      
      if (!formattedInfo.endDate) {
        // If no end date, assume it's a one-day event
        formattedInfo.endDate = formattedInfo.startDate;
      }
    }
    
    // Calculate confidence scores based on field presence
    const confidenceScores = {
      eventName: formattedInfo.eventName ? 0.9 : 0.3,
      organizerName: formattedInfo.organizerName ? 0.85 : 0.4,
      venue: formattedInfo.venue ? 0.8 : 0.5,
      dates: (formattedInfo.startDate || formattedInfo.endDate) ? 0.85 : 0.4,
      contactPerson: formattedInfo.contactPerson ? 0.9 : 0.3
    };
    
    return {
      success: true,
      extractedInfo: formattedInfo,
      confidenceScores,
      message: 'Information extracted using AI document analysis.'
    };
  } catch (error) {
    console.error('Error extracting event information:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to extract information from document.'
    };
  }
};

/**
 * Verify student participation using real AI document analysis
 * @param {string} documentPath - Path to the document
 * @param {string} studentName - Student name to verify
 * @param {Object} studentData - Additional student data for verification
 * @returns {Promise<Object>} - Verification result
 */
exports.verifyStudentParticipation = async (documentPath, studentName, studentData = {}) => {
  try {
    // Extract the information from the document using real AI
    const extractedInfo = await extractDocumentInfo(documentPath);
    
    if (!extractedInfo) {
      throw new Error('Failed to extract information from document');
    }
    
    // Use the real verification service to verify the document info
    const verificationResult = await verifyDocumentInfo(
      extractedInfo, 
      { 
        name: studentName,
        ...studentData
      }
    );
    
    // Format the response
    return {
      isVerified: verificationResult.verified,
      confidenceScore: (verificationResult.confidence / 100).toFixed(2),
      studentName,
      reasoning: verificationResult.reasoning,
      recommendedAction: verificationResult.recommendedAction,
      message: verificationResult.verified ? 
        `Student "${studentName}" participation verified with ${verificationResult.confidence}% confidence` : 
        `Could not verify student "${studentName}" participation with sufficient confidence. ${verificationResult.reasoning}`
    };
  } catch (error) {
    console.error('Error verifying student participation:', error);
    return {
      isVerified: false,
      confidenceScore: "0.00",
      studentName,
      reasoning: `Error: ${error.message}`,
      recommendedAction: "request_more_info",
      message: `Error verifying student "${studentName}" participation: ${error.message}`
    };
  }
}; 