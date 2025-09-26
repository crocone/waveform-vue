import type { IllestWaveformProps } from '../types/waveform'

/**
 *  The WebAudio class creates a playable audio instance
 *  and converts the audio into an array for visual processing
 *
 */

export default class WebAudio {
  protected props: IllestWaveformProps
  protected audioCtx: AudioContext
  protected audioBuffer!: AudioBuffer
  protected gainNode!: GainNode
  protected mediaEl?: HTMLAudioElement
  protected mediaSrcNode?: MediaElementAudioSourceNode
  protected playbackRate: number
  private filteredData!: number[]
  private arrayBuffer!: ArrayBuffer

  constructor(props: IllestWaveformProps) {
    this.props = props
    this.audioCtx = new AudioContext()
    this.playbackRate = 1
  }

  get _filteredData(): number[] {
    return this.filteredData
  }

  get _audioDuration(): number {
    if (!this.audioBuffer)
      throw new Error('can not get duration before audio inited')
    return this.audioBuffer.duration
  }

  public async setupAudio(): Promise<void> {
    await this.createAudioBuffer()
    this.createFilterData()
    this.createGainNode()
    await this.initWithMediaElement(this.props.url, false)
  }

  public async fetchAudioFile(): Promise<void> {
    try {
      const response = await fetch(this.props.url, this.props.requestOptions)
      this.arrayBuffer = await response.arrayBuffer()
    } catch (error) {
      console.error(error)
    }
  }

  private async createAudioBuffer(): Promise<void> {
    this.audioBuffer = await this.audioCtx.decodeAudioData(this.arrayBuffer)
  }

  private createGainNode(): void {
    this.gainNode = this.audioCtx.createGain()
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime)
  }

  protected async initWithMediaElement(
    src: string,
    connectToDestination = true
  ): Promise<void> {
    this.disposeMedia()

    const mediaEl = new Audio()
    mediaEl.src = src
    mediaEl.preload = 'auto'
    mediaEl.crossOrigin = 'anonymous'

    ;(mediaEl as any).preservesPitch = true
    ;(mediaEl as any).mozPreservesPitch = true
    ;(mediaEl as any).webkitPreservesPitch = true

    mediaEl.playbackRate = this.playbackRate

    const mediaSrcNode = this.audioCtx.createMediaElementSource(mediaEl)
    if (connectToDestination) {
      mediaSrcNode.connect(this.gainNode)
      this.gainNode.connect(this.audioCtx.destination)
    }

    if (typeof mediaEl.load === 'function') mediaEl.load()

    this.mediaEl = mediaEl
    this.mediaSrcNode = mediaSrcNode
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate
    if (this.mediaEl) {
      this.mediaEl.playbackRate = rate
    }
  }

  protected disposeMedia(): void {
    try {
      this.mediaSrcNode?.disconnect()
    } catch {
      // noop
    }

    this.mediaSrcNode = undefined

    if (this.mediaEl) {
      this.mediaEl.pause()
      this.mediaEl.src = ''
      if (typeof this.mediaEl.load === 'function') this.mediaEl.load()
    }

    this.mediaEl = undefined
  }

  private createFilterData(): void {
    const samplingRate: number = this.props.samplingRate as number
    const filteredData: number[] = []

    const rawDataList: Float32Array = this.audioBuffer.getChannelData(0)

    for (let index = 0; index < samplingRate; index++) {
      const blockSize = Math.floor(rawDataList.length / samplingRate)
      const temp = rawDataList[index * blockSize]
      filteredData.push(temp)
    }

    this.filteredData = filteredData
  }
}
