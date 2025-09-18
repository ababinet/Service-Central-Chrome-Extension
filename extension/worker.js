/**
 * Background script to act as the service worker for the the tab focus functionality
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "storeChatTabID") {
        if (sender.tab && sender.tab.id) {
            chrome.storage.local.set({ chatTabID: sender.tab.id }, () => {
                sendResponse({ status: "stored" });
            });
            return true;
        } else {
            console.warn("No sender tab info to store chatTabID");
            sendResponse({ status: "noTab" });
        }
        return;
    }

    if (message.action === "focusTab") {
        // retrieve the ID of the tab with the chat open
        chrome.storage.local.get("chatTabID", (result) => {
            const tabID = result.chatTabID;
            console.log(tabID);
            if (!tabID) {
                sendResponse({ status: "noTabID" });
                return;
            }
            chrome.tabs.get(tabID, (tab) => {
                if (chrome.runtime.lastError || !tab) {
                    console.warn("Stored tabID is invalid or tab closed");
                    sendResponse({ status: "failed" });
                    return;
                }
                chrome.tabs.update(tabID, { active: true }, () => {
                    if (chrome.runtime.lastError || !tab) {
                        console.warn("Stored tabID is invalid or tab closed");
                        sendResponse({ status: "failed" });
                        return;
                    }
                    chrome.windows.update(tab.windowId, { focused: true }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Error focusing window:", chrome.runtime.lastError);
                            sendResponse({ status: "failed" });
                            return;
                        }
                        sendResponse({ status: "done" });
                    })
                })
            })
        })
        return true;
    }
});

