// Variable to control delay of adding the generated alt text
var setAltTextDelay = 2000;

// Object to store generated alt tags
let savedAltTags = {};

// Function to save alt tags to Chrome storage
function saveAltTags() {
  chrome.storage.local.set({ savedAltTags: savedAltTags }, () => {
    console.log('Alt tags saved to storage');
  });
}

// Function to load saved alt tags from Chrome storage
function loadSavedAltTags(callback) {
  chrome.storage.local.get(['savedAltTags'], (result) => {
    if (result.savedAltTags) {
      savedAltTags = result.savedAltTags;
      console.log('Loaded saved alt tags:', savedAltTags);
    }
    callback();
  });
}

// Main function to process images
function processImages() {
  // Retrieve user settings from Chrome storage
  chrome.storage.sync.get(["apiKey", "enableDisable"], (items) => {
    if (items.enableDisable) {
      loadSavedAltTags(() => {
        // Select all images with missing or empty alt attributes
        const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
        console.log("Found images:", images.length);

        images.forEach((img, index) => {
          if (savedAltTags[img.src]) {
            // Use saved alt tag immediately if available
            console.log("Using saved alt tag for image:", img.src);
            img.alt = savedAltTags[img.src];
          } else {
            console.log("Sending message for image at index:", index);
            // Send message to background script to generate alt text
            chrome.runtime.sendMessage({
              action: "generateAltText",
              imageUrl: img.src,
              imageIndex: index,
            });
          }
        });
      });
    }
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "setAltText") {
    // Select all images with missing or empty alt attributes
    const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
    if (images[request.imageIndex]) {
      console.log("Setting generated alt text for image at index:", request.imageIndex);
      
      // Add delay only when setting generated alt text
      setTimeout(function () {
        // Update the alt attribute of the image
        images[request.imageIndex].alt = request.altText;
        
        // Save the generated alt tag
        savedAltTags[images[request.imageIndex].src] = request.altText;
        saveAltTags();
        
        console.log("Generated alt text set and saved for:", images[request.imageIndex].src);
      }, setAltTextDelay);
    }
  }
});

// Wait for the DOM to be fully loaded before executing the main function
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processImages);
} else {
  processImages();
}