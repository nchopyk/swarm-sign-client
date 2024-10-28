window.IPC.onShowAuthScreen((code) => {
  document.getElementById('auth-code').textContent = code;
  switchScreen('auth');
});


window.IPC.onPlayerStart(({ schedule }) => {
  switchScreen('player');

  if (!schedule || !schedule.medias || !schedule.medias.data.length) {
    document.getElementById('player-screen').appendChild(document.createTextNode('No media found in the schedule'));
    return;
  }

  const mediaData = schedule.medias.data;

  let currentMediaIndex = 0;

  // Function to display the current media
  function displayMedia(media) {
    const playerScreen = document.getElementById('player-screen');
    playerScreen.innerHTML = ''; // Clear previous content

    const mediaType = media.media.type;

    if (mediaType === 'image') {
      const img = document.createElement('img');
      img.src = media.media.content;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100vh';
      img.style.objectFit = 'contain';
      playerScreen.appendChild(img);
    } else if (mediaType === 'video') {
      const video = document.createElement('video');
      video.src = media.media.content;
      video.controls = false;
      video.autoplay = true;
      video.loop = true;
      video.muted = true; // Optional: Ensure no audio plays
      video.style.maxWidth = '100%';
      video.style.maxHeight = '100vh';
      video.style.objectFit = 'contain';

      // Handle video end based on duration
      video.addEventListener('loadedmetadata', () => {
        const duration = parseInt(media.duration, 10) || Math.ceil(video.duration);
        setTimeout(() => {
          currentMediaIndex = (currentMediaIndex + 1) % mediaData.length;
          playNextMedia();
        }, duration * 1000);
      });

      playerScreen.appendChild(video);
    } else {
      playerScreen.textContent = `Unsupported media type: ${mediaType}`;
    }
  }

  // Function to play the next media in sequence
  function playNextMedia() {
    const media = mediaData[currentMediaIndex];
    displayMedia(media);
  }

  // Start playing the media sequence
  playNextMedia();
});


function switchScreen(target) {
  const loadingScreen = document.getElementById('loading-screen');
  const authScreen = document.getElementById('auth-screen');
  const playerScreen = document.getElementById('player-screen');

  const targets = {
    auth: () => {
      authScreen.classList.remove('hidden');
      loadingScreen.classList.add('hidden');
      playerScreen.classList.add('hidden');
    },
    player: () => {
      authScreen.classList.add('hidden');
      loadingScreen.classList.add('hidden');
      playerScreen.classList.remove('hidden');
    }
  };

  const action = targets[target];

  if (action) {
    action();
  } else {
    console.error('Invalid target:', target);
  }
}
