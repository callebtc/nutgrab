function getBrowser() {
    return typeof browser !== 'undefined' ? browser : chrome;
  }

  function saveLightningAddress() {
    const addressInput = document.getElementById("lightning-address");
    const address = addressInput.value;
    getBrowser().storage.local.set({ lightningAddress: address });
  }
  
  function loadLightningAddress() {
    getBrowser().storage.local.get("lightningAddress", (data) => {
      if (data.lightningAddress) {
        const addressInput = document.getElementById("lightning-address");
        addressInput.value = data.lightningAddress;
      }
    });
  }
function getCashuTokens() {
    const bodyText = document.body.textContent;
    const regex = /\bcashuA\w+\b/gi;
    const matches = bodyText.match(regex) || [];
    return matches;
  }

  function fetchCashuTokenMatches() {
    getBrowser().tabs.query({ active: true, currentWindow: true }, (tabs) => {
      getBrowser().scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: getCashuTokens,
        },
        (results) => {
          if (getBrowser().runtime.lastError) {
            console.error(getBrowser().runtime.lastError);
            return;
          }
  
          getBrowser().storage.local.get("lightningAddress", (data) => {
            const tokens = Array.isArray(results[0]) ? results[0] : [];
            handleMessage({ action: "getCashuTokens", data: tokens, lightningAddress: data.lightningAddress });
          });
        }
      );
    });
  }
  
  function handleMessage(request, sender, sendResponse) {
    if (request.action === "getCashuTokens") {
      const cashuTokenMatches = document.getElementById("cashu-token-matches");
      cashuTokenMatches.innerHTML = "";
      const lightningAddress = request.lightningAddress;
      request.data.forEach((match) => {
        const li = document.createElement("li");
        const url = `https://redeem.cashu.me?token=${encodeURIComponent(match)}&lightning=${encodeURIComponent(lightningAddress)}`;
        const link = document.createElement("a");
        link.href = url;
        link.textContent = match;
        li.appendChild(link);
        cashuTokenMatches.appendChild(li);
      });
    }
  }

document.addEventListener("DOMContentLoaded", () => {
    fetchCashuTokenMatches();
    loadLightningAddress();
    document
      .getElementById("save-address")
      .addEventListener("click", saveLightningAddress);
  });
  
  getBrowser().runtime.onMessage.addListener(handleMessage);
