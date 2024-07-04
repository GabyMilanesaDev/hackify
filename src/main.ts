import './main.css';
import { init as authenticatorInit, login, logout } from './auth';
import { getMyPlaylists, initPlayer, playTrack, togglePlay, getPlaylist, getPlaylistTracks, getPlaylistCover, getTrackCover, getUserSavedTracks } from './api';

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

let isPlaying = false;
let queue: string[] = []
console.log(queue)
let position = 0

const updateButtonContent = () => {
  playButton.innerHTML = isPlaying ? `<img src="${pauseIcon}" alt="Pause Icon">` : `<img src="${playIcon}" alt="Play Icon">`;
};

async function init() {
  let profile: UserProfile | undefined;
  try {
    profile = await authenticatorInit();
    initPlayer(document.getElementById('embed-iframe')!);
  } catch (error) {
    console.error(error);
  }

  console.log(profile)
  initPublicSection(profile);
  initPrivateSection(profile);
}

function initPublicSection(profile?: UserProfile): void {
  document.getElementById("loginButton")!.addEventListener("click", login);
  console.log(!profile)
  renderPublicSection(!profile);
}

function renderPublicSection(render: boolean): void {
  publicSection.style.display = render ? "none" : "block";
}

function initPrivateSection(profile?: UserProfile): void {
  console.log(!profile)
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

//  async function startPlayback(uris: string[]): Promise<void> {
//   queue = uris
//   playTrack(uris[position]);


//   console.log(songEnded)

//   if (songEnded) {
//     for (let i = 0; i < uris.length; i++) {
//       playTrack(uris[position]);
//    }
//   }


// }

async function startPlayback(uris: string[]): Promise<void> {
  queue = uris;
  position = 0; 
  await playNextTrack();
}

async function playNextTrack(): Promise<void> {
  if (position >= queue.length) {
    console.log('Todas las canciones han sido reproducidas');
    return;
  }

  // await playTrack(queue[position]);
  position++;

  await playNextTrack();
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

function renderPlaylistPlayButton(tracks: PlaylistTracks) {
  const playPlaylistButton = document.getElementById("playPlaylistButton")!;
  playPlaylistButton.innerHTML = `<img src="${playSecondaryIcon}" alt="Play Icon">`;

  if (!playPlaylistButton) {
    throw new Error("Element not found");
  }
  playPlaylistButton.addEventListener("click", async () => {
    const uris = tracks.items.map(trackItem => trackItem.track.uri);
    startPlayback(uris);
    // togglePlay();

    isPlaying = true;
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
    // togglePlay();

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
          // togglePlay();
          isPlaying = true;
          updateButtonContent();
        }
      }
    });
  });
}

// function skipNextTrack() {
//   position += 1
//   playTrack(queue[position]);
// }

// function skipPreviousTrack() {
//   if (position === 0) {
//     position = 0
//   } else {
//     position -= 1
//   }
//   playTrack(queue[position]);
// }

function initActionsSection(): void {

  skipPreviousButton.innerHTML = `<img src="${skipPreviousIcon}" alt="Skip Previous Icon">`;
  skipNextButton.innerHTML = `<img src="${skipNextIcon}" alt="Skip Next Icon">`;
  shuffleButton.innerHTML = `<img src="${shuffleIcon}" alt="Shuffle Icon">`;
  repeatButton.innerHTML = `<img src="${repeatIcon}" alt="Repeat Icon">`;

  playButton.addEventListener("click", () => {
    togglePlay();
    isPlaying = !isPlaying;
    updateButtonContent(); 
  });

  skipPreviousButton.addEventListener("click", () => {
    skipPreviousTrack();
    // togglePlay();
  }
  );

  skipNextButton.addEventListener("click", () => {
    skipNextTrack();
    // togglePlay();
  });

  updateButtonContent();
  renderActionsSection(true);
}

function renderActionsSection(render: boolean) {
  actionsSection.style.display = render ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", init);
