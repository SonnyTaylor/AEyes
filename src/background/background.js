chrome.runtime.onInstalled.addListener(({reason}) => {
    if (reason === 'install') {
        // Console log to see if extension is installed
        console.log('Extension installed');
    }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Generate alt text for the image
    if (request.action === 'generateAltText') {
        console.log('Message received:', request);
        chrome.storage.sync.get(['apiKey', 'language'], (items) => {
            const apiKey = items.apiKey;
            const language = items.language || 'en';

            // If the API key is set, fetch the alt text
            if (apiKey) {
                fetchAltText(request.imageUrl, apiKey, language)
                    .then(altText => {
                        chrome.tabs.sendMessage(sender.tab.id, {
                            action: 'setAltText',
                            altText: altText,
                            imageIndex: request.imageIndex
                        });
                    })
                    .catch(error => {
                        // Log the error and send an empty alt text
                        // This could be improved
                        console.error('Error generating alt text:', error);
                    });
            }
        });
    }
});

async function fetchAltText(imageUrl, apiKey, language) {
    const url = 'https://api.openai.com/v1/chat/completions';

    // Request body for the OpenAI API
    // Use GPT-4o-mini model for vision but also its cheaper than regular GPT-4
    const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Describe this image as if it were an alt tag in HTML, keep it short and concise only about a few words, respond in this language: ${language}`
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
            // Throw an error if the response is not OK
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const altText = data.choices[0].message.content.trim();

        console.log('Alt text fetched:', altText);

        return altText;
    } catch (error) {
        // This error handling could be improved as well
        console.error('Error:', error);
        return '';
    }
}