// Retrieve user settings from Chrome storage
chrome.storage.sync.get(["apiKey", "enableDisable"], (items) => {
  if (items.enableDisable) {
    // Select all images with missing or empty alt attributes
    const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
    console.log("Found images:", images.length);
    images.forEach((img, index) => {
      console.log("Sending message for image at index:", index);
      // Send message to background script to generate alt text
      chrome.runtime.sendMessage({
        action: "generateAltText",
        imageUrl: img.src,
        imageIndex: index,
      });
    });
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "setAltText") {
    // Select all images with missing or empty alt attributes
    const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
    if (images[request.imageIndex]) {
      console.log("Setting alt text for image at index:", request.imageIndex);
      // Update the alt attribute of the image
      images[request.imageIndex].alt = request.altText;
    }
  }
});
