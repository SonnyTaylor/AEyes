// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  if (request.action === 'generateAltText') {
    chrome.storage.sync.get(['apiKey', 'language'], (items) => {
      const apiKey = items.apiKey;
      const language = items.language || 'en';

      if (apiKey) {
        fetchAltText(request.imageUrl, apiKey, language)
          .then(altText => {
            console.log('Alt text generated:', altText);
            chrome.tabs.sendMessage(sender.tab.id, {
              action: 'setAltText',
              altText: altText,
              imageIndex: request.imageIndex
            });
          })
          .catch(error => {
            console.error('Error generating alt text:', error);
          });
      }
    });
  }
});

async function fetchAltText(imageUrl, apiKey, language) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Describe this image as if it were an alt tag in HTML, respond in this language: ${language}`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    max_tokens: 50
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const altText = data.choices[0].message.content.trim(); // Adjusting for the new format

    console.log('Alt text fetched:', altText); // New console log

    return altText;
  } catch (error) {
    console.error('Error:', error);
    return '';
  }
}