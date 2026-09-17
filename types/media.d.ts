interface AudioTrack {
  id: string;
  kind: string;
  label: string;
  language: string;
  enabled: boolean;
}

interface AudioTrackList {
  readonly length: number;
  [index: number]: AudioTrack;
  getTrackById(id: string): AudioTrack | null;
}
