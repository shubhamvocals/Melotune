import CONFIG from './config.js';

function convertDuration(durationMs) {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = ((durationMs % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function getNoteFromKey(key) {
  const notes = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
  return notes[key];
}

async function displayCurrentPageTrackDetails(accessToken) {
  try {
    const access_token = accessToken;
    console.log(access_token);
    const currentTrackEndpoint = `https://api.spotify.com/v1/me/player/currently-playing`;
    const currentTrackResponse = await fetch(currentTrackEndpoint, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const currentTrackDetails = await currentTrackResponse.json();

    const trackID = currentTrackDetails.item.id;
    const trackEndpoint = `https://api.spotify.com/v1/tracks/${trackID}`;
    const trackResponse = await fetch(trackEndpoint, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });
    const trackDetails = await trackResponse.json();


    const albumEndpoint = `https://api.spotify.com/v1/albums/${trackDetails.album.id}`;
    const albumResponse = await fetch(albumEndpoint, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });
    const albumDetails = await albumResponse.json();

    const audioFeaturesEndpoint = `https://api.spotify.com/v1/audio-features/${trackID}`;
    const audioFeaturesResponse = await fetch(audioFeaturesEndpoint, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });
    const audioFeatures = await audioFeaturesResponse.json();

    document.getElementById('trackName').textContent = trackDetails.name;
    document.getElementById('artistName').textContent = `Artist: ${trackDetails.artists[0].name}`;
    document.getElementById('key').textContent = `Key: ${getNoteFromKey(audioFeatures.key)}`;
    document.getElementById('tempo').textContent = `Tempo: ${audioFeatures.tempo.toFixed(0)} BPM`;
    document.getElementById('duration').textContent = `Duration: ${convertDuration(audioFeatures.duration_ms)}`;
    
    const imageUrl = albumDetails.images[0].url;
    document.getElementById('trackImage').src = imageUrl;
    document.getElementById('trackImage').style.display = 'block';
    document.getElementById('errorMessage').textContent = '';

  } catch (error) {

    console.error('Error fetching track details:', error.message);

    document.getElementById('trackName').textContent = '';
    document.getElementById('artistName').textContent = '';
    document.getElementById('trackImage').style.display = 'none';
    document.getElementById('key').textContent = '';
    document.getElementById('tempo').textContent = '';
    document.getElementById('duration').textContent = '';

  }
}

document.addEventListener('DOMContentLoaded', function() {
  const configData = CONFIG;
  chrome.runtime.sendMessage({ type: 'configData', config: configData });
  chrome.runtime.sendMessage({ type: "launchAuthorization" });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "authorized") {
      chrome.storage.local.get("accessToken", (data) => {
        const accessToken = data.accessToken;
        displayCurrentPageTrackDetails(accessToken);
      });
    }
  });
});

