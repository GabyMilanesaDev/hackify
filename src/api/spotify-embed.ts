export let songEnded: boolean = false;
let currentSongDuration: number = 0;
let currentSongPosition: number = 0;
let EmbedController: any = undefined;

// Player embed (modo gratuito)
// Embed API https://developer.spotify.com/documentation/embeds/references/iframe-api#methods
export function initPlayer(el: HTMLElement): void {
  // @ts-ignore
  window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
    let options = {
      // width: 200,
      // height: 400,
      // uri: 'spotify:track:1NCuYqMc8hKMb4cpNTcJbD'
    };
    let callback = (EmbedController_: any) => {
      EmbedController = EmbedController_;

       EmbedController.addListener('playback_update', (event: any) => {
        if (event.data.isPaused && event.data.position === 0) {
          console.log('La canción ha terminado');
          songEnded = true;
        } else if (!event.data.isPaused && event.data.position > 0) {
          console.log('La canción ha comenzado a reproducirse');
        }
      });

    };
    IFrameAPI.createController(el, options, callback);
  };
}

// export async function playTrack(uri: string): Promise<void> {
//   return new Promise((resolve) => {
//     EmbedController.loadUri(uri);
//     EmbedController.play();

//     // Añadir listener para el evento playback_update
//     const onPlaybackUpdate = (event: any) => {
//       console.log(event.data)
//       if (event.data.isPaused && event.data.position === 0) {
//         console.log('La canción ha terminado');
//         EmbedController.removeListener('playback_update', onPlaybackUpdate);
//         resolve();
//       } else if (!event.data.isPaused && event.data.position > 0) {
//         console.log('La canción ha comenzado a reproducirse');
//       }
//     };

//     EmbedController.addListener('playback_update', onPlaybackUpdate);
//   });
// }

export async function playTrack(track: Track): Promise<void> {
  return new Promise((resolve) => {
    EmbedController.loadUri(track.uri); 
    EmbedController.play();

    const trackCover = document.getElementById("trackCover")!;
    const trackName = document.getElementById("trackName")!;
    const trackArtist = document.getElementById("trackArtist")!;
    const progressPosition = document.getElementById("progressPosition")!;
    const progressDuration = document.getElementById("progressDuration")!;
    // const progressFill = document.getElementById('progressFill');

    trackCover.setAttribute("src", track.album.images[0].url);
    trackName.innerText = track.name;
    trackArtist.innerText = track.artists.map(artist => artist.name).join(', ');
    document.title = track.name;



    const onPlaybackUpdate = (event: any) => {
      if (event.data.isPaused && event.data.position === 0) {
        console.log('La canción ha terminado');
        EmbedController.removeListener('playback_update', onPlaybackUpdate);
        resolve();
      } else if (!event.data.isPaused && event.data.position > 0) {
        currentSongPosition = event.data.position;
        currentSongDuration = event.data.duration;
        progressPosition.innerText = formatDuration(currentSongPosition)
        progressDuration.innerText = formatDuration(currentSongDuration)


      }
    };

    EmbedController.addListener('playback_update', onPlaybackUpdate);
  });
}

export function togglePlay(): void {
  EmbedController.togglePlay();
}

function formatDuration(duration: number): string {
  const seconds = duration / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
  return `${minutes}:${formattedSeconds}`;
}