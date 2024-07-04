export const globalState = {
    songEnded: false,
    songIsPlaying: false,
  };
  
  export function setSongEnded(value: boolean): void {
    globalState.songEnded = value;
  }
  
  export function setSongIsPlaying(value: boolean): void {
    globalState.songIsPlaying = value;
  }