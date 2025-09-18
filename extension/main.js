/***
 * This is the Chrome Version of a browser extension that will play an alert when someone joins
 * the Service Central chat
 */

// variables used to identify the button element for the chat
// use inspect element to verify these have not changed for initial troubleshooting

if (!chrome.runtime) {
    console.error("chrome.runtime is undefined!");
}


const chatOff = "chat-icon-off";
const chatOn = "chat-icon-on";
const chatAlert = "chat-icon-alert";
const chatClasses = [chatOff, chatOn, chatAlert];

let alerted = false;
let observer = null;

function findChatButton() {
    for (const chatClass of chatClasses) {
        const item = document.querySelector(`.${chatClass}`);
        if (item) return item;
    }
    return null;
}

function playSelectedSound() {
    chrome.storage.local.get(["enabled", "notificationSound"], ({ enabled, notificationSound }) => {
        if (!enabled) return; // check if the extension is turned on
        const soundFile = notificationSound || "new-chat2.mp3"; // default sound file
        const audio = new Audio(chrome.runtime.getURL(`sounds/${soundFile}`)); // use selected sound file
        audio.play().catch(e => console.error("Audio play failed:", e));
    });
}

// mutation observer checks for changes to the ext-gen49 button element
function handleClassChange(mutationsList) {
    for(const mutation of mutationsList) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
            const chatButton = mutation.target;
            if (chatButton.classList.contains(chatAlert)) {
                if (!alerted) {
                    chrome.runtime.sendMessage({ action: "storeChatTabID" }, () => chrome.runtime.lastError); // store the current tab ID
                    chrome.runtime.sendMessage({action: "focusTab"}, () => chrome.runtime.lastError); // focus the tab with the chat
                    playSelectedSound();
                    alerted = true;
                }
            } else if (chatButton.classList.contains(chatOn) || chatButton.classList.contains(chatOff)) {
                alerted = false;
            }
        }
    }
}

// find the button element and create the MutationObserver
function attachObserver() {
    if (observer) observer.disconnect();
    const chatButton = findChatButton();
    if (chatButton) {
        observer = new MutationObserver(handleClassChange);
        observer.observe(chatButton, { attributes: true, attributeFilter: ["class"] });
    } else {
        setTimeout(attachObserver, 300);
    }
}

attachObserver();



