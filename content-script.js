function getBrowser() {
  return typeof browser !== "undefined" ? browser : chrome;
}

function getCashuTokens() {
  const bodyText = document.body.textContent;
  const regex = /\bcashuAeyJ0b2\w+\b/gi;
  const matches = bodyText.match(regex) || [];
  return matches;
}

function findTextNodes(element, match) {
  const textNodes = [];
  const walk = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (node.textContent.includes(match)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    },
    false
  );

  while (walk.nextNode()) {
    textNodes.push(walk.currentNode);
  }

  return textNodes;
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
    span.textContent = "Cashu token"
    if (totalAmount > 0) {
      span.textContent += ` (${totalAmount} sats)`;
    }
    // Add the button and the matched text to the container
    container.appendChild(button);
    container.appendChild(span);

    // Replace the original text node with the container
    parent.replaceChild(replacementNode, textNode);
    replacementNode.insertAdjacentElement("afterend", container);
    container.appendChild(replacementNode);
  });
}

getBrowser().storage.local.get("lightningAddress", (data) => {
  const lightningAddress = data.lightningAddress || "";

  getBrowser().runtime.sendMessage({
    action: "getCashuTokens",
    data: getCashuTokens(),
  });

  getCashuTokens().forEach((match) => {
    injectButtons(match, lightningAddress);
  });
});