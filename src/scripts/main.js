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

// Function to resolve relative URLs to absolute URLs
function resolveImageUrl(url) {
  // Creating a temporary anchor element to resolve relative URLs
  const a = document.createElement('a');
  a.href = url;
  return a.href;
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
          let imageUrl = img.src;

          // Resolve relative URL to absolute URL if it's not base64
          if (!imageUrl.startsWith('data:')) {
            imageUrl = resolveImageUrl(imageUrl);
          }

          if (savedAltTags[imageUrl]) {
            // Use saved alt tag immediately if available
            console.log("Using saved alt tag for image:", imageUrl);
            img.alt = savedAltTags[imageUrl];
          } else {
            console.log("Sending message for image at index:", index);
            // Send message to background script to generate alt text
            chrome.runtime.sendMessage({
              action: "generateAltText",
              imageUrl: imageUrl,
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
  // Variable to control delay of adding the generated alt text
  let setAltTextDelay = 2000;
  
  if (request.action === "setAltText") {
    // Select all images with missing or empty alt attributes
    const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
    if (images[request.imageIndex]) {
      console.log("Setting generated alt text for image at index:", request.imageIndex);

      let imageUrl = images[request.imageIndex].src;

      // Resolve relative URL to absolute URL if it's not base64
      if (!imageUrl.startsWith('data:')) {
        imageUrl = resolveImageUrl(imageUrl);
      }

      // Add delay only when setting generated alt text
      setTimeout(function () {
        // Update the alt attribute of the image
        images[request.imageIndex].alt = request.altText;

        // Save the generated alt tag
        savedAltTags[imageUrl] = request.altText;
        saveAltTags();

        console.log("Generated alt text set and saved for:", imageUrl);
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