let CLIENT_ID;
let CLIENT_SECRET;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "configData") {
        const configData = message.config;
        CLIENT_ID = encodeURIComponent(configData.CLIENT_ID);
        CLIENT_SECRET = encodeURIComponent(configData.CLIENT_SECRET);
    }
});
const REDIRECT_URI = chrome.identity.getRedirectURL();
const RESPONSE_TYPE = encodeURIComponent('code');
const SCOPE = encodeURIComponent('user-read-currently-playing');

let ACCESS_TOKEN = '';

function create_spotify_endpoint() {
    let oauth2_url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;
    return oauth2_url;
}

async function getTokensWithCode(code) {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const requestBody = new URLSearchParams();
    requestBody.append("grant_type", "authorization_code");
    requestBody.append("code", code);
    requestBody.append("redirect_uri", REDIRECT_URI);

    const authHeader = "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

    return fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Authorization": authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Authorization failed.");
        }
        return response.json();
    })
    .then(tokens => {
        ACCESS_TOKEN = tokens.access_token;
        chrome.storage.local.set({ accessToken: ACCESS_TOKEN});
    })
    .catch(error => {
        console.error("Error exchanging code for tokens:", error.message);
        chrome.storage.local.remove("accessToken");
    });
}

async function handleAuthorization() {
    const authUrl = create_spotify_endpoint();
    chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        async (redirectUrl) => {
            if (chrome.runtime.lastError) {
                console.error("Authorization error:", chrome.runtime.lastError.message);
                return;
            }
            const url = new URL(redirectUrl);
            const code = url.searchParams.get("code");
            await getTokensWithCode(code);
            chrome.runtime.sendMessage({ type: "authorized"})
        }
    );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "launchAuthorization") {
      handleAuthorization();
    }
});
