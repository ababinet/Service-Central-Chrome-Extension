const toggle = document.getElementById("toggleExtension");
const notificationSelect = document.getElementById("notificationSound");

let currentAudio = null;
let saveTimeout = null;

function saveSettings() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        chrome.storage.local.set({
            enabled: toggle.checked,
            notificationSound: notificationSelect.value,
        });
    }, 250);
}

function loadSettings() {
    chrome.storage.local.get(["enabled", "notificationSound", "audioOutput"], (result) => {
        if (result.enabled != undefined) toggle.checked = result.enabled;
        if (result.notificationSound) notificationSelect.value = result.notificationSound;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // populate sounds dropdown dynamically
    fetch(chrome.runtime.getURL("sounds.json"))
        .then(response => {
            if(!response.ok) throw new Error("Failed to fetch sounds.json");
            return response.json();
        })
        .then(sounds => {
            while(notificationSelect.firstChild) {
                notificationSelect.removeChild(notificationSelect.firstChild);
            }
            sounds.forEach(sound => {
                const option = document.createElement("option");
                option.value = sound.file;
                option.textContent = sound.name;
                notificationSelect.appendChild(option);
            });

            // load saved selection after populating options
            chrome.storage.local.get("notificationSound", ({ notificationSound }) => {
                if (notificationSound) {
                    notificationSelect.value = notificationSound;
                }
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing sounds.json", err);
        });

    // load toggle saved state
    loadSettings();

    // save settings on changes
    toggle.addEventListener("change", saveSettings);
    notificationSelect.addEventListener("change", (event) => {
        saveSettings();

        // stop any playing sound so that there is not an overlap
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        // play the selected notification sound
        const selectedSound = event.target.value;
        currentAudio = new Audio(chrome.runtime.getURL("sounds/" + selectedSound));
        currentAudio.play().catch(err => console.warn("Failed to play notification sound preview", err));

    });
})

