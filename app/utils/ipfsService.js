const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config');

/**
 * Upload file to IPFS using Pinata API
 * @param {string} filePath - Path to file to upload
 * @returns {Promise<string>} - IPFS hash (CID)
 */
const uploadToIPFS = async (filePath) => {
  try {
    // Create form data with file
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    
    // Get file name from path
    const fileName = filePath.split('/').pop();
    
    formData.append('file', fileStream, { filename: fileName });
    
    // Set pinata metadata
    const metadata = JSON.stringify({
      name: `ElizaEdu-${fileName}`,
    });
    formData.append('pinataMetadata', metadata);
    
    // Set options (keep only one copy)
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);
    
    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'pinata_api_key': config.pinata.apiKey,
          'pinata_secret_api_key': config.pinata.secretKey,
        },
      }
    );
    
    // Return IPFS hash (CID)
    return {
      ipfsHash: response.data.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

/**
 * Upload JSON data to IPFS using Pinata API
 * @param {Object} data - JSON data to upload
 * @returns {Promise<string>} - IPFS hash (CID)
 */
const uploadJsonToIPFS = async (data) => {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': config.pinata.apiKey,
          'pinata_secret_api_key': config.pinata.secretKey,
        },
      }
    );
    
    return {
      ipfsHash: response.data.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
};

module.exports = {
  uploadToIPFS,
  uploadJsonToIPFS
}; 