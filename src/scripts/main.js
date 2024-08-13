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
    } else {
      console.log('No saved alt tags found.');
    }
    callback();
  });
}

// Function to generate a unique key for an image
function getImageKey(img) {
  if (img.src.startsWith('data:image')) {
    return 'base64_' + img.src.slice(0, 100); // Use first 100 characters as a "hash"
  }
  return img.src;
}

// Main function to process images
function processImages() {
  chrome.storage.sync.get(["apiKey", "enableDisable"], (items) => {
    if (items.enableDisable) {
      loadSavedAltTags(() => {
        const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
        console.log("Found images:", images.length);

        images.forEach((img, index) => {
          const imageKey = getImageKey(img);
          if (savedAltTags[imageKey]) {
            console.log("Using saved alt tag for image:", imageKey);
            img.alt = savedAltTags[imageKey];
          } else {
            console.log("Sending message for image at index:", index);
            chrome.runtime.sendMessage({
              action: "generateAltText",
              imageUrl: img.src,
              imageIndex: index,
              imageKey: imageKey
            });
          }
        });
      });
    } else {
      console.log("Extension is disabled.");
    }
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  const setAltTextDelay = 2000;
  if (request.action === "setAltText") {
    const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
    if (images[request.imageIndex]) {
      console.log("Setting generated alt text for image at index:", request.imageIndex);
      setTimeout(function () {
        images[request.imageIndex].alt = request.altText;
        savedAltTags[request.imageKey] = request.altText;
        saveAltTags();
        console.log("Generated alt text set and saved for:", request.imageKey);
      }, setAltTextDelay);
    } else {
      console.log("No image found at index:", request.imageIndex);
    }
  }
});

// Wait for the DOM to be fully loaded before executing the main function
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processImages);
} else {
  processImages();
}