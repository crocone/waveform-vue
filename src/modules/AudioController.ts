import WebAudio from './Audio'
import type { IllestWaveformProps } from '../types/waveform'
import timeCounter from '../utils/time-counter'

/**
 *  WebAudioController Class creates construct,
 *  which can control the web audio behaviors.
 *  It's inheirts from WebAudio Class.
 *
 */

export default class WebAudioController extends WebAudio {
  private startAt: number
  private pauseAt: number
  private pickAt: number
  private playing: boolean
  private audioBufferSourceNode!: AudioBufferSourceNode | null
  private FADE_DURATION: number

  constructor(props: IllestWaveformProps) {
    super(props)
    this.startAt = 0
    this.pauseAt = 0
    this.pickAt = 0
    this.playing = false
    this.FADE_DURATION = this.props.fade ? 0.08 : 0
  }

  get _playing(): boolean {
    return this.playing
  }

  get _currentTime(): number {
    if (this.mediaEl) return this.mediaEl.currentTime
    if (this.pauseAt) return this.pauseAt
    if (this.startAt) return this.audioCtx.currentTime - this.startAt
    return this.audioCtx.currentTime
  }

  public play(): void {
    if (this.mediaEl) {
      this.playWithMediaElement()
      return
    }

    this.disconnectDestination()
    this.createAudioBufferSourceNode()
    this.connectDestination()

    const offset = this.pickAt ? this.pickAt : this.pauseAt
    this.audioBufferSourceNode!.start(0, offset)
    this.startAt = this.audioCtx.currentTime - offset
    this.pauseAt = 0
    this.playing = true

    if (!this.props.fade) {
      this.setGainValue(1)
    } else {
      this.setGainValue(0)
      this.setGainLinearRamp(1)
    }
  }

  public async pause(): Promise<void> {
    if (this.mediaEl) {
      await this.pauseWithMediaElement()
      return
    }

    const elapsed = this.audioCtx.currentTime - this.startAt

    if (this.props.fade) {
      this.setGainLinearRamp(0)
      await timeCounter(this.FADE_DURATION * 1000)
    }

    this.disconnectDestination()
    this.initializeState()
    this.pauseAt = elapsed + this.FADE_DURATION
  }

  public pick(pickedTime: number): void {
    this.pickAt = pickedTime
    if (this.mediaEl) {
      this.mediaEl.currentTime = pickedTime
      if (!this.playing) {
        this.pauseAt = pickedTime
        return
      }
      return
    }
    if (!this.playing) return
    this.disconnectDestination()
    this.play()
  }

  public replay(): void {
    if (this.mediaEl) {
      this.mediaEl.currentTime = 0
      this.pauseAt = 0
      this.pickAt = 0
      this.playWithMediaElement()
      return
    }
    if (this.audioBufferSourceNode) {
      this.disconnectDestination()
      this.initializeState()
    }
    this.play()
  }

  public finish(): void {
    this.pauseAt = 0
    if (this.mediaEl) {
      this.mediaEl.pause()
      this.mediaEl.currentTime = 0
      this.disconnectDestination()
      this.initializeState()
      return
    }
    this.disconnectDestination()
    this.initializeState()
  }

  public setPlaybackRate(rate: number): void {
    super.setPlaybackRate(rate)

    if (this.audioBufferSourceNode) {
      this.audioBufferSourceNode.playbackRate.value = rate
      if (!this.mediaEl) {
        console.warn('[Audio] setPlaybackRate via buffer path не сохраняет питч')
      }
    }
  }

  private initializeState() {
    this.playing = false
    this.startAt = 0
    this.pauseAt = 0
    this.pickAt = 0
  }

  private createAudioBufferSourceNode(): void {
    if (this.audioBufferSourceNode) return
    this.audioBufferSourceNode = this.audioCtx.createBufferSource()
    this.audioBufferSourceNode.buffer = this.audioBuffer
    this.audioBufferSourceNode.playbackRate.value = this.playbackRate
  }

  private connectDestination(): void {
    if (this.mediaSrcNode) {
      this.mediaSrcNode.connect(this.gainNode)
      this.gainNode.connect(this.audioCtx.destination)
      return
    }
    if (!this.audioBufferSourceNode) return
    this.audioBufferSourceNode.connect(this.gainNode)
    this.gainNode.connect(this.audioCtx.destination)
  }

  private disconnectDestination(): void {
    if (this.mediaSrcNode) {
      try {
        this.mediaSrcNode.disconnect()
        this.gainNode.disconnect()
      } catch {
        // noop
      }
      return
    }
    if (!this.audioBufferSourceNode) return
    this.audioBufferSourceNode.disconnect()
    this.audioBufferSourceNode.stop()
    this.audioBufferSourceNode = null
  }

  private setGainValue(v: number): void {
    this.gainNode.gain.setValueAtTime(v, this.audioCtx.currentTime)
  }

  private setGainLinearRamp(v: number): void {
    this.gainNode.gain.linearRampToValueAtTime(
      v,
      this.audioCtx.currentTime + this.FADE_DURATION!
    )
  }

  private playWithMediaElement(): void {
    if (!this.mediaEl) return

    const offset = this.pickAt ? this.pickAt : this.pauseAt
    if (offset) this.mediaEl.currentTime = offset

    this.disconnectDestination()
    this.connectDestination()

    const playPromise = this.mediaEl.play()

    this.startAt = this.audioCtx.currentTime - offset
    this.pauseAt = 0
    this.playing = true

    if (!this.props.fade) {
      this.setGainValue(1)
    } else {
      this.setGainValue(0)
      this.setGainLinearRamp(1)
    }

    playPromise.catch((error) => {
      console.error('[Audio] Failed to play media element', error)
    })
  }

  private async pauseWithMediaElement(): Promise<void> {
    if (!this.mediaEl) return

    if (this.props.fade) {
      this.setGainLinearRamp(0)
      await timeCounter(this.FADE_DURATION * 1000)
    }

    this.mediaEl.pause()
    const pausedAt = this.mediaEl.currentTime

    this.disconnectDestination()
    this.initializeState()
    this.pauseAt = pausedAt
  }
}
