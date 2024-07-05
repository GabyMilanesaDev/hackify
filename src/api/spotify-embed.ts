export let songEnded: boolean = false;
import { setSongEnded, setSongIsPlaying } from '../utils/globals'
let EmbedController: any = undefined;

let currentSongPosition: number = 0;
let currentSongDuration: number = 0;
let currentTrackUri: string = "";

const progressPosition = document.getElementById("progressPosition")!;
const progressDuration = document.getElementById("progressDuration")!;
const progressFill = document.getElementById('progressFill')!;

export function initPlayer(el: HTMLElement): void {
  // @ts-ignore
  window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
    let options = {};
    let callback = (EmbedController_: any) => {
      EmbedController = EmbedController_;
      EmbedController.addListener('playback_update', (event: any) => {
        if (event.data.isPaused && event.data.position === 0) {
          // console.log('La canción ha terminado');
          // console.log(event.data)
          setSongEnded(true);
          setSongIsPlaying(false);
        } else if (!event.data.isPaused && event.data.position > 0) {
          console.log('La canción está sonando');
          currentSongPosition = event.data.position;
          currentSongDuration = event.data.duration;
          progressPosition.innerText = formatDuration(currentSongPosition);
          progressDuration.innerText = formatDuration(currentSongDuration);
          const percentage = (currentSongPosition / currentSongDuration) * 100;
          progressFill.style.width = `${percentage}%`;
          updateProgressBall();
          setSongIsPlaying(true);
        } else if (event.data.isPaused && event.data.position > 0) {
          console.log('La canción está pausada');
          setSongIsPlaying(false);
        } 
      });
    };
    IFrameAPI.createController(el, options, callback);
  };
}

export async function playTrack(track: any, startAt: number = 0): Promise<void> {
  currentSongPosition = startAt;
  currentSongDuration = 0;
  currentTrackUri = track.uri;

  return new Promise((resolve) => {
    EmbedController.loadUri(track.uri, false, startAt);
    EmbedController.play();

    const trackCover = document.getElementById("trackCover")!;
    const trackName = document.getElementById("trackName")!;
    const trackArtist = document.getElementById("trackArtist")!;


    trackCover.setAttribute("src", track.album.images[0].url);
    trackName.innerText = track.name;
    trackArtist.innerText = track.artists.map((artist: any) => artist.name).join(', ');
    document.title = track.name;

    const onPlaybackUpdate = (event: any) => {
      if (event.data.isPaused && event.data.position === 0) {
        currentSongPosition = 0;
        currentSongDuration = 0;
        progressPosition.innerText = formatDuration(currentSongPosition);
        progressDuration.innerText = formatDuration(currentSongDuration);
        // const percentage = (currentSongPosition / currentSongDuration) * 100;
        progressFill.style.width = `${0}%`;
        updateProgressBall();
        console.log({currentSongPosition})
        console.log({currentSongDuration})
        EmbedController.removeListener('playback_update', onPlaybackUpdate);
        resolve();
      } else if (!event.data.isPaused && event.data.position > 0) {
        currentSongPosition = event.data.position;
        currentSongDuration = event.data.duration;
        progressPosition.innerText = formatDuration(currentSongPosition);
        progressDuration.innerText = formatDuration(currentSongDuration);
        const percentage = (currentSongPosition / currentSongDuration) * 100;
        progressFill.style.width = `${percentage}%`;
        updateProgressBall();
      } 
    };

    EmbedController.addListener('playback_update', onPlaybackUpdate);
  });
}

export function togglePlay(): void {
  EmbedController.togglePlay();
}

export function forwardSong(seconds: number): void {
  const newPosition = currentSongPosition + (seconds * 1000);
  if (newPosition >= 0 && newPosition < currentSongDuration) {
    EmbedController.loadUri(currentTrackUri, newPosition);
    EmbedController.play();
  }
}

function updateProgressBall() {
  const forwardButton = document.getElementById('forwardButton')!;
  const percentage = (currentSongPosition / currentSongDuration) * 100;
  forwardButton.style.left = `calc(${percentage}% - 7.5px)`;
}

function handleProgressBarClick(event: MouseEvent) {
  const progressBar = document.querySelector('.progress-bar') as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const newPercentage = (clickX / progressBar.clientWidth) * 100;
  const newPosition = Math.floor((newPercentage / 100) * currentSongDuration);
  currentSongPosition = newPosition;
  updateProgressBall();
}

function setupEventListeners() {
  const forwardButton = document.getElementById('forwardButton')!;
  forwardButton.addEventListener('mousedown', (event) => {
    let isDragging = false;

    const onMouseMove = (event: MouseEvent) => {
      isDragging = true;
      handleProgressBarClick(event);
    };

    const onMouseUp = (event: MouseEvent) => {
      if (isDragging) {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const newPercentage = (clickX / progressBar.clientWidth) * 100;
        const newPosition = Math.floor((newPercentage / 100) * currentSongDuration);
        currentSongPosition = newPosition;
        console.log(newPosition)
        EmbedController.loadUri(currentTrackUri, false, newPosition/1000);
        EmbedController.play();
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });
  });
}

document.addEventListener('DOMContentLoaded', setupEventListeners);

function formatDuration(duration: number): string {
  const seconds = duration / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
  return `${minutes}:${formattedSeconds}`;
}
