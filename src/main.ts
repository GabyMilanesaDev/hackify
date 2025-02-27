import './main.css';
import { init as authenticatorInit, login, logout } from './auth';
import { getMyPlaylists, initPlayer, playTrack, togglePlay, getPlaylist, getPlaylistTracks, getPlaylistCover, getTrackCover, getUserSavedTracks, searchTracks, getFeaturedPlaylists, getCategories, getCategoryPlaylists } from './api';
import playIcon from '/play.svg';
import playSecondaryIcon from '/play-secondary.svg';
import pauseIcon from '/pause.svg';
import pauseSecondaryIcon from '/pause-secondary.svg';
import shuffleIcon from '/shuffle.svg';
import shuffleActiveIcon from '/shuffle-active.svg';
import skipPreviousIcon from '/skip-previous.svg';
import skipNextIcon from '/skip-next.svg';
import repeatIcon from '/repeat.svg';
import repeatOneIcon from '/repeat-one.svg';
import repeatAllIcon from '/repeat-all.svg';
import { globalState, setSongIsPlaying } from './utils/globals'

function checkGlobalState() {
  if (globalState.songIsPlaying) {
    updateButtonContent();
  } else if (!globalState.songIsPlaying) {
    updateButtonContent();
  }
}

setInterval(checkGlobalState, 100);

const publicSection = document.getElementById("publicSection")!;
const privateSection = document.getElementById("privateSection")!;
const profileSection = document.getElementById("profileSection")!;
const playlistsSection = document.getElementById("playlistsSection")!;
const actionsSection = document.getElementById("actionsSection")!;
const playlistDetail = document.getElementById("playlistDetail")!;
const homeButton = document.getElementById("homeButton")!;
const playButton = document.getElementById("playButton")!;
const playSavedSongsButton = document.getElementById("playSavedSongsButton")!;
const playPlaylistButton = document.getElementById("playPlaylistButton")!;
const shuffleButton = document.getElementById("shuffleButton")!;
const skipPreviousButton = document.getElementById("previousTrackButton")!;
const skipNextButton = document.getElementById("nextTrackButton")!;
const repeatButton = document.getElementById("repeatButton")!;
const searchInput = document.getElementById('searchInput')!;
searchInput.addEventListener('input', debounce(performSearch, 500));

let queue: string[] = []
let position = 0
let loopMode = 'none';
let shuffleMode = false;
const colors = ['#8D67AB','#BA5D08', '#608109', '#26856B', '#1E3264', '#E8105B']

const updateButtonContent = () => {
  playButton.innerHTML = globalState.songIsPlaying ? `<img src="${pauseIcon}" alt="Pause Icon">` : `<img src="${playIcon}" alt="Play Icon">`;
  playPlaylistButton.innerHTML = globalState.songIsPlaying ? `<img src="${pauseSecondaryIcon}" alt="Pause Icon">` : `<img src="${playSecondaryIcon}" alt="Play Icon">`;
  playSavedSongsButton.innerHTML = globalState.songIsPlaying ? `<img src="${pauseSecondaryIcon}" alt="Pause Icon">` : `<img src="${playSecondaryIcon}" alt="Play Icon">`;
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

function initPrivateSection(profile?: UserProfile): void {
  renderPrivateSection(!!profile);
  renderPlaylistDetail(false);
  renderSearchSection(false);
  renderSavedSongs(false);
  renderSavedSongsDetail(false);
  renderPlaylistsSection(false)
  initMenuSection();
  initHomeSection();
  initProfileSection(profile);
  initPlaylistSection(profile);
  initActionsSection();
}

function initMenuSection(): void {

  homeButton.addEventListener("click", () => {
    initHomeSection();
    renderHomeSection(true);
    renderProfileSection(!false);
    renderPlaylistsSection(false);
    renderBrowsePlaylistsDetail(false);
    renderPlaylistDetail(false);
    renderSavedSongsDetail(false);
    renderSavedSongs(false);
    renderSearchSection(false);
  });

  searchInput.addEventListener("focus", () => {
    renderHomeSection(false);
    renderSearchSection(true);
    renderBrowsePlaylistsDetail(false);
    renderPlaylistsSection(false);
    renderPlaylistDetail(false);
    renderSavedSongs(false);
    renderSavedSongsDetail(false);
  });

  document.getElementById("savedSongsButton")!.addEventListener("click", () => {
    renderHomeSection(false);
    initUserSavedSongs();
    renderSavedSongs(false);
    renderBrowsePlaylistsDetail(false);
    renderSavedSongsDetail(true);
    renderPlaylistsSection(false);
    renderPlaylistDetail(false);
    renderSearchSection(false);
  });
  
  document.getElementById("profileButton")!.addEventListener("click", () => {
    renderHomeSection(false);
    renderProfileSection(profileSection.style.display !== "none");
    renderPlaylistDetail(false);
    renderBrowsePlaylistsDetail(false);
    renderPlaylistsSection(false)
    renderSearchSection(false);
  });

  document.getElementById("playlistsButton")!.addEventListener("click", () => {
    renderHomeSection(false);
    renderPlaylistsSection(true);
    renderBrowsePlaylistsDetail(false);
    renderPlaylistDetail(false)
    renderSavedSongs(false);
    renderSavedSongsDetail(false);
    renderSearchSection(false);
  });

  document.getElementById("logoutButton")!.addEventListener("click", logout);

}

function initProfileSection(profile?: UserProfile | undefined) {
  renderProfileSection(!!profile);
  if (profile) {
    renderProfileData(profile);
  }
}

function renderPublicSection(render: boolean): void {
  publicSection.style.display = render ? "none" : "block";
}

function renderPrivateSection(isLogged: boolean) {
  privateSection.style.display = isLogged ? "block" : "none";
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

function renderSearchSection(render: boolean) {
  const searchSection = document.getElementById("searchSection")!;
  searchSection.style.display = render ? "block" : "none";
}

function renderHomeSection(render: boolean) {
  const homeSection = document.getElementById("homeSection")!;
  homeSection.style.display = render ? "block" : "none";
}

function renderBrowsePlaylistsDetail(render: boolean) {
  const browsePlaylistsDetail = document.getElementById("browsePlaylistsDetail")!;
  browsePlaylistsDetail.style.display = render ? "block" : "none";
}

function initHomeSection(): void {
  getFeaturedPlaylists()
    .then((playlists: PlaylistRequest): void => {
      if (playlists.playlists.items.length >= 3) {

        const getRandomIndex = (max: number) => Math.floor(Math.random() * max);
        
        let selectedIndexes = new Set<number>();

        while (selectedIndexes.size < 3) {
          selectedIndexes.add(getRandomIndex(playlists.playlists.items.length));
        }
        
        const selectedItems = Array.from(selectedIndexes).map(index => playlists.playlists.items[index]);
        
        renderFeaturedCategories(selectedItems);
      } else {
        console.log("No hay suficientes elementos para seleccionar 3 aleatoriamente.");
      }
    });

    getCategories()
    .then((categories: any): void => {
      if (categories.categories.items.length > 0) {
        renderCategories(categories.categories.items);
      } else {
        console.log("No hay categorías disponibles.");
      }
    });
    
}

function renderFeaturedCategories(featuredPlaylists: any): void {
  const featuredCategories = document.getElementById("featuredPlaylists");

  if (!featuredCategories) {
    throw new Error("Element not found");
  }

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  featuredCategories.innerHTML = '';

  featuredPlaylists.forEach((category: any) => {
    const li = document.createElement('li');
    const figure = document.createElement('figure');
    figure.style.backgroundColor = getRandomColor();
    figure.innerHTML = `<figcaption>${category.name}</figcaption>`;

    figure.addEventListener('click', () => {
      renderHomeSection(false);
      renderPlaylistsSection(false);
      renderPlaylistDetail(true);
      renderPlaylistCover(category.id);
      loadPlaylistTracks(category.id);
    });

    li.appendChild(figure);
    featuredCategories.appendChild(li);
  });
}

function renderCategories(categories: any): void {
  const browseCategories = document.getElementById("browsePlaylists");

  if (!browseCategories) {
    throw new Error("Element not found");
  }

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  browseCategories.innerHTML = '';

  categories.forEach((category: any) => {
    const li = document.createElement('li');
    const figure = document.createElement('figure');
    figure.style.backgroundColor = getRandomColor();
    figure.innerHTML = `<figcaption>${category.name}</figcaption>`;

    figure.addEventListener('click', async () => {
      renderHomeSection(false);
      renderPlaylistsSection(false);
      renderPlaylistDetail(false);
      renderBrowsePlaylistsDetail(true);
      document.getElementById("categoryName")!.innerText = category.name;

      try {
        const playlists = await getCategoryPlaylists(category.id);
        const playlistsWithImages = await Promise.all(playlists.playlists.items.map(async (playlist) => {
          const imageUrl = await getPlaylistCover(localStorage.getItem("accessToken")!, playlist.id);
          return {
            ...playlist,
            imageUrl
          };
        }));

        const browseCategoryPlaylists = document.getElementById("browseCategoryPlaylists")!;
        browseCategoryPlaylists.innerHTML = '';
        playlistsWithImages.forEach((playlist) => {
          const li = document.createElement('li');
          li.className = 'playlist-item';
        
          const img = document.createElement('img');
          img.src = playlist.imageUrl;
          img.alt = `Cover of ${playlist.name}`;
          img.width = 231;
          img.height = 231;
        
          li.addEventListener('click', () => {

            document.getElementById("browsePlaylistsDetail")!.style.display = "none";
            console.log(`Playlist ${playlist.name} clicked!`);
            renderHomeSection(false);
            renderPlaylistsSection(false);
            renderPlaylistDetail(true);
            renderPlaylistCover(playlist.id);
            loadPlaylistTracks(playlist.id);
          });
        
          li.appendChild(img);
          browseCategoryPlaylists.appendChild(li);
        });

      } catch (error) {
        console.error('Error fetching playlist covers:', error);
      }
    });

    li.appendChild(figure);
    browseCategories.appendChild(li);
  });
}

async function startPlayback(tracks: any) {
  if (tracks.length > 0) {
    queue = shuffleMode ? shuffleArray(tracks) : tracks;
    position = 0;
    await playNextTrack();
  }
}

async function playNextTrack() {
  if (position < queue.length) {
    await playTrack(queue[position]);
    position++;
    if (position < queue.length) {
      setTimeout(async () => {
        await playNextTrack();
      }, 100);
    } else if (loopMode === 'all') {
      position = 0;
      setTimeout(async () => {
        await playNextTrack();
      }, 100);
    } else if (loopMode === 'one') {
      position--;
      setTimeout(async () => {
        await playNextTrack();
      }, 100);
    } else {
      console.log('Se han reproducido todas las canciones.');
    }
  }
}

function skipTrack() {
  if (loopMode === 'one') {
    playTrack(queue[position - 1]);
  } else {
    if (position < queue.length) {
      position++;
      playTrack(queue[position]);
    } else if (loopMode === 'all') {
      position = 0;
      playTrack(queue[position]);
      position++;
    } else {
      console.log('Se han reproducido todas las canciones.');
    }
  }
  if (loopMode === 'one') {
    loopMode = 'all';
    repeatButton.innerHTML = `<img src="${repeatAllIcon}" alt="Repeat Icon">`;
  }
}

function skipPreviousTrack() {
  if (loopMode === 'one') {
    playTrack(queue[position - 1]);
  } else {
    if (position > 1) {
      position--;
      playTrack(queue[position - 1]);
    } else if (loopMode === 'all') {
      position = queue.length;
      playTrack(queue[position - 1]);
    }
  }
  if (loopMode === 'one') {
    loopMode = 'all';
    repeatButton.innerHTML = `<img src="${repeatAllIcon}" alt="Repeat Icon">`;
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

function renderPlaylistPlayButton(tracks: any) {
  playPlaylistButton.innerHTML = `<img src="${playSecondaryIcon}" alt="Play Icon">`;

  if (!playPlaylistButton) {
    throw new Error("Element not found");
  }

  playPlaylistButton.addEventListener("click", async () => {

    if (tracks.items.every((trackItem: any) => queue.some((track: any) => track.id === trackItem.track.id))) {
      playPlaylistButton.innerHTML = `<img src="${pauseSecondaryIcon}" alt="Play Icon">`;
      console.log("La playlist es la misma");
      togglePlay();
    } else if (tracks.items.every((trackItem: any) => queue.some((track: any) => track.id !== trackItem.track.id))){
      playPlaylistButton.innerHTML = `<img src="${playSecondaryIcon}" alt="Play Icon">`;
      queue = tracks.items.map((trackItem: any) => trackItem.track);
      position = 0;
      startPlayback(queue);
    } else {
      queue = tracks.items.map((trackItem: any) => trackItem.track);
      position = 0;
      startPlayback(queue);
    }
  });
}

function renderSavedSongsPlayButton(tracks: PlaylistTracks) {
  playSavedSongsButton.innerHTML = `<img src="${playSecondaryIcon}" alt="Play Icon">`;

  if (!playSavedSongsButton) {
    throw new Error("Element not found");
  }
  playSavedSongsButton.addEventListener("click", async () => {
    queue = tracks.items.map((trackItem: any) => trackItem.track);
    position = 0;
    startPlayback(queue);
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
              <div class="track-item-info">
                <p>${track.name}</p>
                <p>${track.artists.map(artist => artist.name).join(', ')}</p>
              </div>
              <div class="track-item-album">
                ${track.album.name}
              </div>
              <div class="track-item-album-artist">
                ${track.album.artists[0].name}
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
    setSongIsPlaying(globalState.songIsPlaying);
  });

  skipPreviousButton.addEventListener("click", () => {
    skipPreviousTrack();
    if (loopMode === 'one') {
      loopMode = 'all';
      repeatButton.innerHTML = `<img src="${repeatAllIcon}" alt="Repeat Icon">`;
    }
  });

  skipNextButton.addEventListener("click", () => {
    skipTrack();
    if (loopMode === 'one') {
      loopMode = 'all';
      repeatButton.innerHTML = `<img src="${repeatAllIcon}" alt="Repeat Icon">`;
    }
  });

  repeatButton.addEventListener("click", () => {
    if (loopMode === 'none') {
      loopMode = 'all';
      repeatButton.innerHTML = `<img src="${repeatAllIcon}" alt="Repeat Icon">`;
    } else if (loopMode === 'all') {
      loopMode = 'one';
      repeatButton.innerHTML = `<img src="${repeatOneIcon}" alt="Repeat Icon">`;
    } else {
      loopMode = 'none';
      repeatButton.innerHTML = `<img src="${repeatIcon}" alt="Repeat Icon">`;
    }
  });

  shuffleButton.addEventListener("click", () => {
    shuffleMode = !shuffleMode;
    shuffleButton.innerHTML = shuffleMode ? `<img src="${shuffleActiveIcon}" alt="Shuffle Active Icon">` : `<img src="${shuffleIcon}" alt="Shuffle Icon">`;
    if (shuffleMode) {
      shuffleCurrentQueue();
    }
  });

  renderActionsSection(true);
}

function shuffleCurrentQueue() {
  if (queue.length > 0) {
    const currentTrack = queue[position - 1];
    const remainingQueue = queue.slice(position);
    queue = [currentTrack, ...shuffleArray(remainingQueue)];
    position = 1;
  }
}

function renderActionsSection(render: boolean) {
  actionsSection.style.display = render ? "block" : "none";
}

// Debounce para evitar utilizar un botón y no hacer muchas llamada a la API por cada caracter introducido
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...funcArgs: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

async function performSearch() {
  const inputElement = document.getElementById('searchInput') as HTMLInputElement;
  const query = inputElement.value;
  if (query) {
    try {
      const response = await searchTracks(query);
      const playlistTracks: PlaylistTracks = {
        total: response.tracks.total,
        items: response.tracks.items.map(item => ({ track: item }))
      };
      renderTracks(playlistTracks, "searchResultsTracks");
      inputElement.value = '';
    } catch (error) {
      console.error('Error buscando canciones:', error);
    }
  }
}

document.addEventListener("DOMContentLoaded", init);