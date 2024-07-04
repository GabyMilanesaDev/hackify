
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
  description: string;
};

type PlaylistRequest = {
  items: Playlist[];
};

type PlaylistTracks = {
  total: number;
  items: TrackItem[];
};

type TrackItem = {
  track: Track;
};

type Track = {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: Artist[];
  album: {
    name: string;
    artists: Artist[];
    images: {
      url: string;
      height: number;
      width: number;
    }[];
  };
};

type TrackResponse = {
  tracks: {
    items: Track[];
    total: number;
  };
};

type Artist = {
  name: string;
};

type PlaybackState = {
  is_playing: boolean;
  progress_ms: number;
  item: {
    id: string;
    name: string;
    artists: Artist[];
    duration_ms: number;
  };
};