// main.js
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiKey', 'enableDisable'], (items) => {
        if (items.enableDisable) {
            const images = document.querySelectorAll('img:not([alt])');
            images.forEach((img, index) => {
                console.log('Sending message for image at index:', index);
                chrome.runtime.sendMessage({
                    action: 'generateAltText',
                    imageUrl: img.src,
                    imageIndex: index
                });
            });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setAltText') {
        const images = document.querySelectorAll('img:not([alt])');
        if (images[request.imageIndex]) {
            console.log('Setting alt text for image at index:', request.imageIndex);
            images[request.imageIndex].alt = request.altText;
        }
    }
});
