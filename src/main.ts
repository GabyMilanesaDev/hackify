import './main.css';
import { init as authenticatorInit, login, logout } from './auth';
import { getMyPlaylists, initPlayer, playTrack, togglePlay, getPlaylist, getPlaylistTracks, getPlaylistCover, getTrackCover, getUserSavedTracks } from './api';
import { globalState, setSongIsPlaying } from './utils/globals'

console.log({globalState})

if (globalState.songEnded) {
  console.log('La canción ha terminado');
} else if (globalState.songIsPlaying) {
  console.log('La canción está sonando');
}


import playIcon from '/play.svg';
import playSecondaryIcon from '/play-playlist.svg';
import pauseIcon from '/pause.svg';
import shuffleIcon from '/shuffle.svg';
import skipPreviousIcon from '/skip-previous.svg';
import skipNextIcon from '/skip-next.svg';
import repeatIcon from '/loop.svg';

const publicSection = document.getElementById("publicSection")!;
const privateSection = document.getElementById("privateSection")!;
const profileSection = document.getElementById("profileSection")!;
const playlistsSection = document.getElementById("playlistsSection")!;
const actionsSection = document.getElementById("actionsSection")!;

const playlistDetail = document.getElementById("playlistDetail")!;

const homeButton = document.getElementById("homeButton")!;

const playButton = document.getElementById("playButton")!;
const shuffleButton = document.getElementById("shuffleButton")!;
const skipPreviousButton = document.getElementById("previousTrackButton")!;
const skipNextButton = document.getElementById("nextTrackButton")!;
const repeatButton = document.getElementById("repeatButton")!;
const searchInput = document.getElementById("search-tracks") as HTMLInputElement;


searchInput.addEventListener('input', async () => {
  const searchText = searchInput.value;
  if (searchText.length > 2) {
    try {
      const tracks = await searchTracks(searchText);
      renderTracksSearched(tracks)

    } catch (error) {
      console.log('Error al buscar: ', error)
    }
  }
})

// let isPlaying = false;
let queue: string[] = []
let position = 0
let loopMode = 'none';
let shuffleMode = false;

console.log(localStorage.getItem("songIsPlaying"))

const updateButtonContent = () => {
  playButton.innerHTML = globalState.songIsPlaying ? `<img src="${pauseIcon}" alt="Pause Icon">` : `<img src="${playIcon}" alt="Play Icon">`;
};

async function init() {
  let profile: UserProfile | undefined;
  try {
    profile = await authenticatorInit();
    initPlayer(document.getElementById('embed-iframe')!);
  } catch (error) {
    console.error(error);
  }
  initPublicSection(profile);
  initPrivateSection(profile);
}

function initPublicSection(profile?: UserProfile): void {
  document.getElementById("loginButton")!.addEventListener("click", login);
  renderPublicSection(!profile);
}

async function searchTracks(searchText: string) {
  console.log('Adios', searchText)
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchText)}&type=track`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error fetching tracks')
  }

  const data = await response.json();
  return data.tracks.items;
  console.log('data', data)

}

function renderTracksSearched(searchedTracks: any) {
  console.log('searched', searchTracks)
  const resultTracksContainer = document.getElementById('results-tracks-container');

  if (!resultTracksContainer) {
    throw new Error('Not found');
  }
  resultTracksContainer.className = "track-list-container";
  resultTracksContainer.innerHTML = searchedTracks.map((track: any) => `
    <div>
      <p> ${track.name} </p>
    </div>
    
    `).join('')
}


function renderPublicSection(render: boolean): void {
  publicSection.style.display = render ? "none" : "block";
}

function initPrivateSection(profile?: UserProfile): void {
  renderPrivateSection(!!profile);
  renderPlaylistDetail(false);
  renderSavedSongs(false);
  renderSavedSongsDetail(false);
  initMenuSection();
  initProfileSection(profile);
  initPlaylistSection(profile);
  initActionsSection();
}

function renderPrivateSection(isLogged: boolean) {
  privateSection.style.display = isLogged ? "block" : "none";
}

function initMenuSection(): void {

  homeButton.addEventListener("click", () => {
    renderProfileSection(!false);
    renderPlaylistsSection(true);
    renderPlaylistDetail(false);
    renderSavedSongsDetail(false);
    renderSavedSongs(false);
  });

  document.getElementById("savedSongsButton")!.addEventListener("click", () => {
    initUserSavedSongs();
    renderSavedSongs(false);
    renderSavedSongsDetail(true);
    renderPlaylistsSection(false);
    renderPlaylistDetail(false);
  });
  
  document.getElementById("profileButton")!.addEventListener("click", () => {
    renderProfileSection(profileSection.style.display !== "none");
    renderPlaylistDetail(false);
    renderPlaylistsSection(false)
  });
  document.getElementById("playlistsButton")!.addEventListener("click", () => {
    renderPlaylistsSection(true);
    renderPlaylistDetail(false)
    renderSavedSongs(false);
    renderSavedSongsDetail(false);
  });


  document.getElementById("logoutButton")!.addEventListener("click", logout);
}

function initProfileSection(profile?: UserProfile | undefined) {
  renderProfileSection(!!profile);
  if (profile) {
    renderProfileData(profile);
  }
}

function renderProfileSection(render: boolean) {
  profileSection.style.display = render ? "none" : "block";
}

function renderProfileData(profile: UserProfile) {
  document.getElementById("displayName")!.innerText = profile.display_name;
  document.getElementById("id")!.innerText = profile.id;
  document.getElementById("email")!.innerText = profile.email;
  document.getElementById("uri")!.innerText = profile.uri;
  document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url")!.innerText = profile.href;
  document.getElementById("url")!.setAttribute("href", profile.href);
  document.getElementById("profilePicture")!.setAttribute("src", profile.images[0].url);
  document.getElementById("savedSongsProfilePicture")!.setAttribute("src", profile.images[0].url);
  document.getElementById("profileName")!.innerText = profile.display_name;
  document.getElementById("savedSongsProfileName")!.innerText = profile.display_name;
}

function initPlaylistSection(profile?: UserProfile): void {
  if (profile) {
    getMyPlaylists(localStorage.getItem("accessToken")!)
      .then((playlists: PlaylistRequest): void => {
        renderPlaylistsSection(!!profile);
        renderPlaylists(playlists);
      });
  }
}

function initUserSavedSongs(): void {
  getUserSavedTracks(localStorage.getItem("accessToken")!)
    .then((tracks: PlaylistTracks): void => {
      renderTracks(tracks, "savedSongsTracks");
      renderSavedSongsPlayButton(tracks)
      document.getElementById("totalSavedSongs")!.innerText = `· ${tracks.total.toString()} canciones`;
    });
}

function renderSavedSongs(render: boolean) {
  const savedSongsSection = document.getElementById("savedSongs")!;
  savedSongsSection.style.display = render ? "block" : "none";
}

function renderSavedSongsDetail(render: boolean) {
  const savedSongsDetail = document.getElementById("savedSongsDetail")!;
  savedSongsDetail.style.display = render ? "block" : "none";
}

function renderPlaylistsSection(render: boolean) {
  playlistsSection.style.display = render ? "block" : "none";
}

function renderPlaylistDetail(render: boolean) {
  playlistDetail.style.display = render ? "block" : "none";
}

async function startPlayback(tracks: any) {
  if (tracks.length > 0) {
    let tracksToPlay = shuffleMode ? shuffleArray(tracks) : tracks;
    await playTrack(tracksToPlay[position]);

    position++;

    if (position < tracksToPlay.length) {
      setTimeout(async () => {
        await playNextTrack(tracksToPlay); 
      }, 100);
    } else {
      console.log('Se han reproducido todas las canciones.');
    }
  }
}

async function playNextTrack(tracks: any) {
  if (position < tracks.length) {
    await playTrack(tracks[position]);
    position++; 
  } else {
    console.log('Se han reproducido todas las canciones.');
  }
}

function skipTrack() {
  if (loopMode === 'one') {
    playTrack(queue[position]);
  } else {
    if (position < queue.length - 1) {
      position++;
      playTrack(queue[position]);
    } else {
      if (loopMode === 'all') {
        position = 0;
        playTrack(queue[position]);
      }
    }
  }
}

function skipPreviousTrack() {
  if (loopMode === 'one') {
    playTrack(queue[position]);
  } else {
    if (position > 0) {
      position--;
      playTrack(queue[position]);
    } else {
      if (loopMode === 'all') {
        position = queue.length - 1;
        playTrack(queue[position]);
      }
    }
  }
}

function renderPlaylistCover(playlistId: string) {
  const cover = document.getElementById("playlistCover");
  if (!cover) {
    throw new Error("Element not found");
  }
  getPlaylistCover(localStorage.getItem("accessToken")!, playlistId)
    .then((coverUrl) => {
      cover.setAttribute("src", coverUrl);
    });
}

function renderPlaylistDescription(playlist: Playlist): void {
  const descriptionElement = document.getElementById("playlistDescription");
  if (!descriptionElement) {
    throw new Error("Element not found: playlistDescription");
  }
  descriptionElement.innerText = playlist.description;
}

function renderPlaylistName(playlist: Playlist): void {
  const nameElement = document.getElementById("playlistName");
  if (!nameElement) {
    throw new Error("Element not found: playlistName");
  }
  nameElement.innerText = playlist.name;
}

async function renderPlaylists(playlists: PlaylistRequest) {
  const playlistElement = document.getElementById("playlists");
  if (!playlistElement) {
    throw new Error("Element not found");
  }
  const playlistsWithImages = await Promise.all(playlists.items.map(async (playlist) => {
    const imageUrl = await getPlaylistCover(localStorage.getItem("accessToken")!, playlist.id);
    return {
      ...playlist,
      imageUrl
    };
  }));

  playlistElement.innerHTML = playlistsWithImages.map((playlist) => {
    return `<li data-playlist-id="${playlist.id}" class="playlist-item">
              <img src="${playlist.imageUrl}" alt="${playlist.name}" style="width: 231px; height: 231px;">
            </li>`;
  }).join('');

  document.querySelectorAll('.playlist-item').forEach(item => {
    item.addEventListener('click', (event) => {
      const playlistId = (event.currentTarget as HTMLElement).getAttribute('data-playlist-id');
      if (playlistId) {
        renderPlaylistsSection(false);
        renderPlaylistDetail(true);
        renderPlaylistCover(playlistId);
        loadPlaylistTracks(playlistId);
      }
    });
  });
}

function renderPlaylistPlayButton(tracks:any) {
  const playPlaylistButton = document.getElementById("playPlaylistButton")!;
  playPlaylistButton.innerHTML = `<img src="${playSecondaryIcon}" alt="Play Icon">`;

  if (!playPlaylistButton) {
    throw new Error("Element not found");
  }

  playPlaylistButton.addEventListener("click", async () => {
    queue = tracks.items.map((trackItem: any) => trackItem.track);
    position = 0;
    startPlayback(queue);
    console.log({queue})
    setSongIsPlaying(true)
    updateButtonContent(); 
  });
}

function renderSavedSongsPlayButton(tracks: PlaylistTracks) {
  const playSavedSongsButton = document.getElementById("playSavedSongsButton")!;
  playSavedSongsButton.innerHTML = `<img src="${playSecondaryIcon}" alt="Play Icon">`;

  if (!playSavedSongsButton) {
    throw new Error("Element not found");
  }
  playSavedSongsButton.addEventListener("click", async () => {
    const uris = tracks.items.map(trackItem => trackItem.track.uri);
    startPlayback(uris);
    updateButtonContent(); 
  });
}

async function loadPlaylistTracks(playlistId: string): Promise<void> {
  try {
    const token = localStorage.getItem("accessToken")!;
    const [playlist, tracks] = await Promise.all([
      getPlaylist(token, playlistId),
      getPlaylistTracks(token, playlistId)
    ]);
    renderPlaylistDescription(playlist);
    renderPlaylistName(playlist)
    renderTracks(tracks, "playlistTracks");
    renderPlaylistPlayButton(tracks)
  } catch (error) {
    console.error('Error loading playlist tracks:', error);
  }
}

async function renderTracks(tracks: PlaylistTracks, element: string): Promise<void> {
  const tracksElement = document.getElementById(element);
  if (!tracksElement) {
    throw new Error("Element not found");
  }

  const trackItemsHTML = await Promise.all(tracks.items.map(async (trackItem) => {
    const track = trackItem.track;
    const coverUrl = await getTrackCover(track.id);
    return `
    <li data-track-id="${track.id}" class="track-item">
              <img src="${coverUrl}" alt="Cover" style="width: 50px; height: 50px;">
              <div>
                <p>${track.name}</p>
                <p>${track.artists.map(artist => artist.name).join(', ')}</p>
              </div>
            </li>
            `;
  }));

  tracksElement.innerHTML = trackItemsHTML.join('');

  tracksElement.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', async () => {
      const trackId = item.getAttribute('data-track-id');
      if (trackId) {
        const track = tracks.items.find(trackItem => trackItem.track.id === trackId)?.track;
        if (track) {
          await playTrack(track);
         // isPlaying = true
          setSongIsPlaying(true);
          updateButtonContent();
        }
      }
    });
  });
}

function shuffleArray(array: any) {
  let newArray = array.slice();
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function initActionsSection(): void {

  skipPreviousButton.innerHTML = `<img src="${skipPreviousIcon}" alt="Skip Previous Icon">`;
  skipNextButton.innerHTML = `<img src="${skipNextIcon}" alt="Skip Next Icon">`;
  shuffleButton.innerHTML = `<img src="${shuffleIcon}" alt="Shuffle Icon">`;
  repeatButton.innerHTML = `<img src="${repeatIcon}" alt="Repeat Icon">`;

  playButton.addEventListener("click", () => {
    togglePlay();
    if (globalState.songIsPlaying) {  
      setSongIsPlaying(true);
    } else if (!globalState.songIsPlaying) {
      setSongIsPlaying(false);
    }
    updateButtonContent(); 
  });

  skipPreviousButton.addEventListener("click", () => {
    skipPreviousTrack();
  });

  skipNextButton.addEventListener("click", () => {
    skipTrack();
  });

  repeatButton.addEventListener("click", () => {
     if (loopMode === 'none') {
       loopMode = 'all';
       console.log({loopMode})
     } else if (loopMode === 'all') {
       loopMode = 'one';
       console.log({loopMode})
     } else {
       loopMode = 'none';
       console.log({loopMode})
     }
  });

  shuffleButton.addEventListener("click", () => {
    shuffleMode = !shuffleMode;
    console.log({shuffleMode})
  });

  updateButtonContent();
  renderActionsSection(true);
}

function renderActionsSection(render: boolean) {
  actionsSection.style.display = render ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", init);