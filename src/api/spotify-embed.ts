
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
        }
      });

    };
    IFrameAPI.createController(el, options, callback);
  };
}

export function playTrack(uri: string): void {
  console.log(`Reproduciendo track con URI: ${uri}`);
  EmbedController.loadUri(uri);
  EmbedController.play();

}

export function togglePlay(): void {
  EmbedController.togglePlay();
}