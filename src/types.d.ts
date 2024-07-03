
type UserProfile = {
  country: string;
  display_name: string;
  email: string;
  explicit_content: {
    filter_enabled: boolean,
    filter_locked: boolean
  },
  external_urls: { spotify: string; };
  followers: { href: string; total: number; };
  href: string;
  id: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  product: string;
  type: string;
  uri: string;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
}

type Playlist = {
  id: string;
  name: string;
};

type PlaylistRequest = {
  items: Playlist[];
};

type PlaylistTracks = {
  items: TrackItem[];
};

type TrackItem = {
  track: Track;
};

type Track = {
  name: string;
  artists: Artist[];
};

type Artist = {
  name: string;
};