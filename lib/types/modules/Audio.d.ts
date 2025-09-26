import type { IllestWaveformProps } from '../types/waveform';
/**
 *  The WebAudio class creates a playable audio instance
 *  and converts the audio into an array for visual processing
 *
 */
export default class WebAudio {
    protected props: IllestWaveformProps;
    protected audioCtx: AudioContext;
    protected audioBuffer: AudioBuffer;
    protected gainNode: GainNode;
    protected mediaEl?: HTMLAudioElement | undefined;
    protected mediaSrcNode?: MediaElementAudioSourceNode | undefined;
    protected playbackRate: number;
    private filteredData;
    private arrayBuffer;
    constructor(props: IllestWaveformProps);
    get _filteredData(): number[];
    get _audioDuration(): number;
    setupAudio(): Promise<void>;
    fetchAudioFile(): Promise<void>;
    protected initWithMediaElement(src: string, connectToDestination?: boolean): Promise<void>;
    setPlaybackRate(rate: number): void;
    protected disposeMedia(): void;
    private createAudioBuffer;
    private createGainNode;
    private createFilterData;
}
