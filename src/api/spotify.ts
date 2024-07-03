import { generateCodeChallenge, generateCodeVerifier } from "../utils";

const apiAccount = 'https://accounts.spotify.com'
const api = 'https://api.spotify.com'

export async function redirectToProvider(): Promise<void> {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", import.meta.env.VITE_CLIENTID);
  params.append("response_type", "code");
  params.append("redirect_uri", import.meta.env.VITE_URI_CALLBACK);
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `${apiAccount}/authorize?${params.toString()}`;
}

export async function getTokens(code: string): Promise<TokenResponse> {
  const verifier = localStorage.getItem("verifier");
  if(!verifier){
    throw new Error("Code verifier not found");
  }
  const params = new URLSearchParams();

  params.append("client_id", import.meta.env.VITE_CLIENTID);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", import.meta.env.VITE_URI_CALLBACK);
  params.append("code_verifier", verifier!);

  const result = await fetch(`${apiAccount}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const { access_token, refresh_token } = await result.json();
  return {
    access_token,
    refresh_token
  };
}

export async function getProfile(token: string): Promise<UserProfile> {
  const result = await fetch(`${api}/v1/me`, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

export async function getMyPlaylists(token: string): Promise<PlaylistRequest> {
  const result = await fetch(`${api}/v1/me/playlists`, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });
  return await result.json();
}

// TODO agregar nuevas funciones para obtener playlists, canciones, etc

export async function getPlaylist(token: string, playlistId: string): Promise<Playlist> {
  const response = await fetch(`${api}/v1/playlists/${playlistId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch playlist');
  }
  return await response.json();
}

export async function getPlaylistTracks(token: string, playlistId: string): Promise<PlaylistTracks> {
  const result = await fetch(`${api}/v1/playlists/${playlistId}/tracks`, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

export async function getPlaylistCover(token: string, playlistId: string): Promise<string> {
  const result = await fetch(`${api}/v1/playlists/${playlistId}/images`, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  const images = await result.json();
  return images[0].url;
}

export async function getTrackCover(trackId: string): Promise<string> {
  const token = localStorage.getItem("accessToken")!;
  const response = await fetch(`${api}/v1/tracks/${trackId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch track details');
  }
  const data = await response.json();
  return data.album.images[0].url;
}

// export async function getCurrentPlaybackState(): Promise<PlaybackState> {
//   const token = localStorage.getItem("accessToken")!;
//   console.log(token)
//   const result = await fetch(`${api}/v1/me/player`, {
//     method: "GET", headers: { Authorization: `Bearer ${token}` }
//   });
//   const resultData = await result.json();
//   console.log(resultData)
//   return resultData;
// }