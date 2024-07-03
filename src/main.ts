import './main.css';
import { init as authenticatorInit, login, logout } from './auth';
import { getMyPlaylists, initPlayer, playTrack, togglePlay, getPlaylist, getPlaylistTracks, getPlaylistCover, getTrackCover } from './api';

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

  initPublicSection(profile);
  initPrivateSection(profile);
}

function initPublicSection(profile?: UserProfile): void {
  document.getElementById("loginButton")!.addEventListener("click", login);
  renderPublicSection(!!profile);
}

function renderPublicSection(render: boolean): void {
  publicSection.style.display = render ? "none" : "block";
}

function initPrivateSection(profile?: UserProfile): void {
  renderPrivateSection(!!profile);
  initMenuSection();
  initProfileSection(profile);
  initPlaylistSection(profile);
  initActionsSection();
}

function renderPrivateSection(isLogged: boolean) {
  privateSection.style.display = isLogged ? "block" : "none";
}

function initMenuSection(): void {
  document.getElementById("profileButton")!.addEventListener("click", () => {
    renderProfileSection(profileSection.style.display !== "none");
  });
  document.getElementById("playlistsButton")!.addEventListener("click", () => {
    renderPlaylistsSection(playlistsSection.style.display !== "none");
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
}

function initPlaylistSection(profile?: UserProfile): void {
  if (profile) {
    getMyPlaylists(localStorage.getItem("accessToken")!)
      .then((playlists: PlaylistRequest): void => {
        renderPlaylistsSection(!!profile);
        renderPlaylists(playlists);
        document.querySelectorAll('.playlist-item').forEach(item => {
          item.addEventListener('click', (event) => {
            const playlistId = (event.target as HTMLElement).getAttribute('data-playlist-id');
            if (playlistId) {
              renderPlaylistCover(playlistId);
              loadPlaylistTracks(playlistId);
            }
          });
        });
      });
  }
}

function renderPlaylistsSection(render: boolean) {
  playlistsSection.style.display = render ? "block" : "none";
}

 async function startPlayback(uris: string[]): Promise<void> {
  queue = uris
  playTrack(uris[position]);
  //  for (let i = 0; i < uris.length; i++) {
  //    playTrack(uris[i]);
  //  }
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

function renderPlaylists(playlists: PlaylistRequest) {
  const playlist = document.getElementById("playlists");
  if (!playlist) {
    throw new Error("Element not found");
  }
  playlist.innerHTML = playlists.items.map((playlist) => {
    return `<li data-playlist-id="${playlist.id}" class="playlist-item">${playlist.name}</li>`;
  }).join('');
  
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
    currentTrackInfo(tracks.items[0].track);
    // togglePlay();

    isPlaying = true;
    updateButtonContent(); 
  });
}

export function currentTrackInfo(track: Track) {
  const trackCover = document.getElementById("trackCover")!;
  const trackName = document.getElementById("trackName")!;
  const trackArtist = document.getElementById("trackArtist")!;
  trackCover.setAttribute("src", track.album.images[0].url);
  trackName.innerText = track.name;
  trackArtist.innerText = track.artists.map(artist => artist.name).join(', ');
  document.title = track.name;

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
    renderTracks(tracks);
    renderPlaylistPlayButton(tracks)
  } catch (error) {
    console.error('Error loading playlist tracks:', error);
  }
}

async function renderTracks(tracks: PlaylistTracks): Promise<void> {
  const tracksElement = document.getElementById("tracks");
  if (!tracksElement) {
    throw new Error("Element not found");
  }

  const trackItemsHTML = await Promise.all(tracks.items.map(async (trackItem) => {
    const track = trackItem.track;
    const coverUrl = await getTrackCover(track.id);
    return `<li data-track-uri="${track.uri}" class="track-item">
              <img src="${coverUrl}" alt="Cover" style="width: 50px; height: 50px;">
              <div>
              <p>${track.name}</p>
              <p>${track.artists.map(artist => artist.name).join(', ')}</p>
              </div>
            </li>`;
  }));

  tracksElement.innerHTML = trackItemsHTML.join('');

  tracksElement.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', async () => {
      const trackUri = item.getAttribute('data-track-uri');
      if (trackUri) {
        playTrack(trackUri);
        // togglePlay();
        isPlaying = true;
        updateButtonContent(); 
      }
    });
  });
}

function skipNextTrack() {
  position += 1
  playTrack(queue[position]);
}

function skipPreviousTrack() {
  if (position === 0) {
    position = 0
  } else {
    position -= 1
  }
  playTrack(queue[position]);
}

function initActionsSection(): void {

  skipPreviousButton.innerHTML = `<img src="${skipPreviousIcon}" alt="Pause Icon">`;
  skipNextButton.innerHTML = `<img src="${skipNextIcon}" alt="Pause Icon">`;
  shuffleButton.innerHTML = `<img src="${shuffleIcon}" alt="Pause Icon">`;
  repeatButton.innerHTML = `<img src="${repeatIcon}" alt="Pause Icon">`;

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
