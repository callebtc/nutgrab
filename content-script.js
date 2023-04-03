function getBrowser() {
  return typeof browser !== "undefined" ? browser : chrome;
}

function getCashuTokens() {
  const bodyText = document.documentElement.innerHTML;
  const regex = /\b(cashuAeyJ0b2)\w+\b/gi;
  const matches = bodyText.match(regex) || [];
  return matches;
}

function findTextNodes(element, match) {
  const nodes = [];
  const walk = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (
          node.parentNode.tagName === "INPUT" ||
          node.parentNode.tagName === "TEXTAREA"
        ) {
          return NodeFilter.FILTER_SKIP;
        }
        if (node.textContent.includes(match)) {
          const parent = node.parentNode;
          if (parent.nodeType === Node.ELEMENT_NODE) {
            nodes.push(parent);
          }
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  while (walk.nextNode()) {}

  return nodes;
}

function injectButtons(match, lightningAddress) {
  const textNodes = findTextNodes(document.body, match);
  const url = `https://redeem.cashu.me?token=${encodeURIComponent(
    match
  )}&lightning=${encodeURIComponent(lightningAddress)}`;

  textNodes.forEach((textNode) => {
    let totalAmount = 0;
    try {
      const tokenWithoutPrefix = match.slice(6);
      const obj = JSON.parse(atob(tokenWithoutPrefix));
      obj.token[0].proofs.forEach((proof) => {
        totalAmount += proof.amount;
      });
    } catch {
      return;
    }

    const parent = textNode.parentNode;
    const replacementNode = document.createElement("span");

    // Create a div to hold the button and the matched text
    const container = document.createElement("div");
    container.style.borderRadius = "10px";
    container.style.padding = "2px";
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.backgroundColor = "#773cc3";

    // Create a button
    const button = document.createElement("button");
    button.style.marginRight = "5px";
    button.style.padding = "5px 10px";
    button.style.fontSize = "10px";
    button.style.color = "white";
    button.style.backgroundColor = "#5e11bf";
    button.style.border = "1px solid #9876c2";
    button.style.borderRadius = "10px";
    button.style.cursor = "pointer";
    button.style.fontFamily = "monospace";

    // Set the button text and onclick handler
    button.textContent = "REDEEM";
    button.onclick = () => {
      window.open(url, "_blank");
    };

    // Create a span to hold the matched text
    const span = document.createElement("span");
    span.style.marginRight = "5px";
    span.style.color = "white";
    span.style.fontFamily = "monospace";
    span.style.padding = "0px 2px 2px 2px";
    span.textContent = "Cashu token";
    if (totalAmount > 0) {
      span.textContent += ` (${totalAmount} sats)`;
    }

    // Create a span to hold the copy icon
    const copyButton = document.createElement("span");
    copyButton.style.marginLeft = "5px";
    copyButton.style.marginRight = "5px";
    copyButton.style.padding = "5px 8px";
    copyButton.style.fontSize = "8px";
    copyButton.style.cursor = "pointer";
    copyButton.style.border = "1px solid #9876c2";
    copyButton.style.borderRadius = "10px";
    copyButton.style.color = "white";
    copyButton.style.fontFamily = "monospace";
    // copyButton.innerHTML = "&#x1f4cb;";
    copyButton.textContent = "copy";

    // Add an onclick event to copy the text and display "copied" text
    copyButton.onclick = () => {
      const tempInput = document.createElement("input");
      tempInput.value = match;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      copyButton.textContent = "copied";
      // copyButton.innerHTML = "copied &#x1f4cb;";

      setTimeout(() => {
        // copyButton.innerHTML = "&#x1f4cb;";
        copyButton.textContent = "copy";
      }, 10000);
    };

    // Add the button and the matched text to the container
    container.appendChild(button);
    container.appendChild(span);
    container.appendChild(copyButton);

    // Replace the original text node with the container
    parent.replaceChild(replacementNode, textNode);
    replacementNode.insertAdjacentElement("afterend", container);
    container.appendChild(replacementNode);
  });
}

// function init() {
//   getBrowser().storage.local.get("lightningAddress", (data) => {
//     const lightningAddress = data.lightningAddress || "";

//     getBrowser().runtime.sendMessage({
//       action: "getCashuTokens",
//       data: getCashuTokens(),
//     });

//     getCashuTokens().forEach((match) => {
//       injectButtons(match, lightningAddress);
//     });
//   });

//   // Watch for changes to the DOM and call injectButtons() when new elements are added
//   const observer = new MutationObserver((mutations) => {
//     getCashuTokens().forEach((match) => {
//       mutations.forEach((mutation) => {
//         const newNodes = mutation.addedNodes;
//         newNodes.forEach((node) => {
//           if (node.nodeType === Node.TEXT_NODE) {
//             if (node.textContent.includes(match)) {
//               injectButtons(match, lightningAddress);
//             }
//           } else if (node.nodeType === Node.ELEMENT_NODE) {
//             const textNodes = findTextNodes(node, match);
//             textNodes.forEach((textNode) => {
//               if (textNode.textContent.includes(match)) {
//                 injectButtons(match, lightningAddress);
//               }
//             });
//           }
//         });
//       });
//     });
//   });

//   observer.observe(document.body, { childList: true, subtree: true });
// }

// init();

function init() {
  const lightningAddress =
    getBrowser().storage.local.get("lightningAddress") || "";
  getCashuTokens().forEach((match) => {
    injectButtons(match, lightningAddress);
  });
  getBrowser().runtime.sendMessage({
    action: "getCashuTokens",
    data: getCashuTokens(),
  });

  // Watch for changes to the DOM and call injectButtons() when new elements are added
  const observer = new MutationObserver((mutations) => {
    getCashuTokens().forEach((match) => {
      mutations.forEach((mutation) => {
        const newNodes = mutation.addedNodes;
        newNodes.forEach((node) => {
          if (
            node.parentNode.tagName === "INPUT" ||
            node.parentNode.tagName === "TEXTAREA"
          ) {
            return;
          }
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.includes(match)) {
              injectButtons(match, lightningAddress);
            }
          } 
          // else if (node.nodeType === Node.ELEMENT_NODE) {
          //   const textNodes = findTextNodes(node, match);
          //   textNodes.forEach((textNode) => {
          //     if (textNode.textContent.includes(match)) {
          //       injectButtons(match, lightningAddress);
          //     }
          //   });
          // }
        });
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

init();
