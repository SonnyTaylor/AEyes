// Function to save settings
function saveSettings() {
    // Get values from input fields
    const apiKey = document.getElementById('apiKey').value;
    const language = document.getElementById('language').value;
    const enableDisable = document.getElementById('enableDisable').checked;

    // Save settings to Chrome storage
    chrome.storage.sync.set({
        apiKey: apiKey,
        language: language,
        enableDisable: enableDisable,
    }).then(() => {
        console.log('Settings saved:', {
            apiKey: apiKey,
            language: language,
            enableDisable: enableDisable,
        });
        // Optionally, show a save confirmation to the user
        alert('Settings saved successfully!');
    });
}

// Function to load settings
function loadSettings() {
    // Load settings from Chrome storage
    chrome.storage.sync.get({
        apiKey: '',
        language: 'en',
        enableDisable: true,
    }).then((items) => {
        // Set values in input fields based on loaded settings
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('language').value = items.language;
        document.getElementById('enableDisable').checked = items.enableDisable;

        console.log('Settings loaded:', items);
    });
}

// Add event listener to the save button
document.getElementById('saveButton').addEventListener('click', saveSettings);

// Load settings when the page is opened
document.addEventListener('DOMContentLoaded', loadSettings);