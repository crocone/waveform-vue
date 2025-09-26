var L = Object.defineProperty;
var G = (a, e, t) => e in a ? L(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var n = (a, e, t) => (G(a, typeof e != "symbol" ? e + "" : e, t), t);
import { defineComponent as V, ref as d, onMounted as $, watchEffect as _, onUnmounted as U, openBlock as X, createElementBlock as j, normalizeStyle as y, createVNode as H, Transition as q, withCtx as Y, withDirectives as w, createElementVNode as A, vShow as k } from "vue";
class J {
  constructor(e, t, i) {
    n(this, "canvasCtx");
    var s;
    this.canvas = e, this.props = t, this.filteredData = i, this.canvas = e, this.canvasCtx = (s = this.canvas) == null ? void 0 : s.getContext("2d"), this.props = t, this.filteredData = i;
  }
  get _canvas() {
    return this.canvas;
  }
  set _props(e) {
    this.props = e;
  }
  get _props() {
    return this.props;
  }
  setupCanvas() {
    this.setCanvasBase(), this.translateCanvasCtx(), this.drawCanvasLines();
  }
  setCanvasBase() {
    this.canvas.width = this.canvas.offsetWidth, this.canvas.height = this.canvas.offsetHeight, this.canvas.style.opacity = "1", this.canvasCtx.fillStyle = "transparent", this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  translateCanvasCtx() {
    this.canvasCtx.translate(
      this.canvas.width / this.filteredData.length,
      this.canvas.height / 2 - this.canvas.height / 2
    );
  }
  drawCanvasLines() {
    const { canvas: e, canvasCtx: t, filteredData: i } = this;
    i.forEach((s, h) => {
      const f = e.width / i.length, m = f * h - f / 2;
      t.moveTo(
        m,
        e.height / 2 - Math.abs(s) * e.height * 0.4
      ), t.lineTo(
        m,
        e.height / 2 + Math.abs(s) * e.height * 0.4
      );
    });
  }
  drawMask(e) {
    const { canvas: t, canvasCtx: i, props: s } = this;
    i.globalCompositeOperation = "destination-atop", i.fillStyle = s.maskColor, i.fillRect(0, 0, e, t.height);
  }
  drawWave() {
    const { canvasCtx: e, props: t } = this;
    e.lineWidth = t.lineWidth, e.lineCap = t.lineCap, e.strokeStyle = t.lineColor, e.stroke();
  }
  setWaveStyle(e) {
    const { canvas: t, canvasCtx: i } = this;
    i.clearRect(0, 0, t.width, t.height), this.drawMask(e), this.drawWave();
  }
}
class K {
  constructor(e) {
    n(this, "props");
    n(this, "audioCtx");
    n(this, "audioBuffer");
    n(this, "gainNode");
    n(this, "mediaEl");
    n(this, "mediaSrcNode");
    n(this, "playbackRate");
    n(this, "filteredData");
    n(this, "arrayBuffer");
    this.props = e, this.audioCtx = new AudioContext(), this.playbackRate = 1;
  }
  get _filteredData() {
    return this.filteredData;
  }
  get _audioDuration() {
    if (!this.audioBuffer)
      throw new Error("can not get duration before audio inited");
    return this.audioBuffer.duration;
  }
  async setupAudio() {
    await this.createAudioBuffer(), this.createFilterData(), this.createGainNode(), await this.initWithMediaElement(this.props.url, !1);
  }
  async fetchAudioFile() {
    try {
      const e = await fetch(this.props.url, this.props.requestOptions);
      this.arrayBuffer = await e.arrayBuffer();
    } catch (e) {
      console.error(e);
    }
  }
  async createAudioBuffer() {
    this.audioBuffer = await this.audioCtx.decodeAudioData(this.arrayBuffer);
  }
  createGainNode() {
    this.gainNode = this.audioCtx.createGain(), this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
  }
  async initWithMediaElement(e, t = !0) {
    this.disposeMedia();
    const i = new Audio();
    i.src = e, i.preload = "auto", i.crossOrigin = "anonymous", i.preservesPitch = !0, i.mozPreservesPitch = !0, i.webkitPreservesPitch = !0, i.playbackRate = this.playbackRate;
    const s = this.audioCtx.createMediaElementSource(i);
    t && (s.connect(this.gainNode), this.gainNode.connect(this.audioCtx.destination)), typeof i.load == "function" && i.load(), this.mediaEl = i, this.mediaSrcNode = s;
  }
  setPlaybackRate(e) {
    this.playbackRate = e, this.mediaEl && (this.mediaEl.playbackRate = e);
  }
  disposeMedia() {
    var e;
    try {
      (e = this.mediaSrcNode) == null || e.disconnect();
    } catch {
    }
    this.mediaSrcNode = void 0, this.mediaEl && (this.mediaEl.pause(), this.mediaEl.src = "", typeof this.mediaEl.load == "function" && this.mediaEl.load()), this.mediaEl = void 0;
  }
  createFilterData() {
    const e = this.props.samplingRate, t = [], i = this.audioBuffer.getChannelData(0);
    for (let s = 0; s < e; s++) {
      const h = Math.floor(i.length / e), f = i[s * h];
      t.push(f);
    }
    this.filteredData = t;
  }
}
function D(a) {
  return new Promise((e) => setTimeout(e, a));
}
class Q extends K {
  constructor(t) {
    super(t);
    n(this, "startAt");
    n(this, "pauseAt");
    n(this, "pickAt");
    n(this, "playing");
    n(this, "audioBufferSourceNode");
    n(this, "FADE_DURATION");
    this.startAt = 0, this.pauseAt = 0, this.pickAt = 0, this.playing = !1, this.FADE_DURATION = this.props.fade ? 0.08 : 0;
  }
  get _playing() {
    return this.playing;
  }
  get _currentTime() {
    return this.mediaEl ? this.mediaEl.currentTime : this.pauseAt ? this.pauseAt : this.startAt ? this.audioCtx.currentTime - this.startAt : this.audioCtx.currentTime;
  }
  play() {
    if (this.mediaEl) {
      this.playWithMediaElement();
      return;
    }
    this.disconnectDestination(), this.createAudioBufferSourceNode(), this.connectDestination();
    const t = this.pickAt ? this.pickAt : this.pauseAt;
    this.audioBufferSourceNode.start(0, t), this.startAt = this.audioCtx.currentTime - t, this.pauseAt = 0, this.playing = !0, this.props.fade ? (this.setGainValue(0), this.setGainLinearRamp(1)) : this.setGainValue(1);
  }
  async pause() {
    if (this.mediaEl) {
      await this.pauseWithMediaElement();
      return;
    }
    const t = this.audioCtx.currentTime - this.startAt;
    this.props.fade && (this.setGainLinearRamp(0), await D(this.FADE_DURATION * 1e3)), this.disconnectDestination(), this.initializeState(), this.pauseAt = t + this.FADE_DURATION;
  }
  pick(t) {
    if (this.pickAt = t, this.mediaEl) {
      if (this.mediaEl.currentTime = t, !this.playing) {
        this.pauseAt = t;
        return;
      }
      return;
    }
    !this.playing || (this.disconnectDestination(), this.play());
  }
  replay() {
    if (this.mediaEl) {
      this.mediaEl.currentTime = 0, this.pauseAt = 0, this.pickAt = 0, this.playWithMediaElement();
      return;
    }
    this.audioBufferSourceNode && (this.disconnectDestination(), this.initializeState()), this.play();
  }
  finish() {
    if (this.pauseAt = 0, this.mediaEl) {
      this.mediaEl.pause(), this.mediaEl.currentTime = 0, this.disconnectDestination(), this.initializeState();
      return;
    }
    this.disconnectDestination(), this.initializeState();
  }
  setPlaybackRate(t) {
    super.setPlaybackRate(t), this.audioBufferSourceNode && (this.audioBufferSourceNode.playbackRate.value = t, this.mediaEl || console.warn("[Audio] setPlaybackRate via buffer path \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u043F\u0438\u0442\u0447"));
  }
  initializeState() {
    this.playing = !1, this.startAt = 0, this.pauseAt = 0, this.pickAt = 0;
  }
  createAudioBufferSourceNode() {
    this.audioBufferSourceNode || (this.audioBufferSourceNode = this.audioCtx.createBufferSource(), this.audioBufferSourceNode.buffer = this.audioBuffer, this.audioBufferSourceNode.playbackRate.value = this.playbackRate);
  }
  connectDestination() {
    if (this.mediaSrcNode) {
      this.mediaSrcNode.connect(this.gainNode), this.gainNode.connect(this.audioCtx.destination);
      return;
    }
    !this.audioBufferSourceNode || (this.audioBufferSourceNode.connect(this.gainNode), this.gainNode.connect(this.audioCtx.destination));
  }
  disconnectDestination() {
    if (this.mediaSrcNode) {
      try {
        this.mediaSrcNode.disconnect(), this.gainNode.disconnect();
      } catch {
      }
      return;
    }
    !this.audioBufferSourceNode || (this.audioBufferSourceNode.disconnect(), this.audioBufferSourceNode.stop(), this.audioBufferSourceNode = null);
  }
  setGainValue(t) {
    this.gainNode.gain.setValueAtTime(t, this.audioCtx.currentTime);
  }
  setGainLinearRamp(t) {
    this.gainNode.gain.linearRampToValueAtTime(
      t,
      this.audioCtx.currentTime + this.FADE_DURATION
    );
  }
  playWithMediaElement() {
    if (!this.mediaEl)
      return;
    const t = this.pickAt ? this.pickAt : this.pauseAt;
    t && (this.mediaEl.currentTime = t), this.disconnectDestination(), this.connectDestination();
    const i = this.mediaEl.play();
    this.startAt = this.audioCtx.currentTime - t, this.pauseAt = 0, this.playing = !0, this.props.fade ? (this.setGainValue(0), this.setGainLinearRamp(1)) : this.setGainValue(1), i.catch((s) => {
      console.error("[Audio] Failed to play media element", s);
    });
  }
  async pauseWithMediaElement() {
    if (!this.mediaEl)
      return;
    this.props.fade && (this.setGainLinearRamp(0), await D(this.FADE_DURATION * 1e3)), this.mediaEl.pause();
    const t = this.mediaEl.currentTime;
    this.disconnectDestination(), this.initializeState(), this.pauseAt = t;
  }
}
function N(a) {
  const e = Math.floor(a / 60), t = Math.floor(a % 60);
  return `${e}:${t < 10 ? "0" : ""}${t}`;
}
class Z {
  constructor(e, t) {
    n(this, "el");
    n(this, "handler");
    n(this, "intersectionObserver");
    n(this, "timer");
    n(this, "rended");
    this.el = e, this.handler = t, this.timer = null, this.rended = !1;
  }
  observe() {
    const e = (t) => {
      if (this.rended)
        return this.unobserve();
      const i = t[0], s = 260;
      i.intersectionRatio > 0 ? this.timer = setTimeout(() => {
        this.handler(), this.rended = !0;
      }, s) : this.timer && (clearTimeout(this.timer), this.timer = null);
    };
    this.intersectionObserver = new IntersectionObserver(e), this.intersectionObserver.observe(this.el);
  }
  unobserve() {
    this.intersectionObserver.unobserve(this.el);
  }
}
let E;
function tt(a, e) {
  E = new Z(a, e), E.observe();
}
function et() {
  E.unobserve();
}
const it = /* @__PURE__ */ V({
  __name: "IllestWaveform",
  props: {
    url: {},
    requestOptions: { default: () => ({}) },
    lineWidth: { default: 0.5 },
    lineCap: { default: "round" },
    lineColor: { default: "#5e5e5e" },
    samplingRate: { default: 22050 },
    cursorWidth: { default: 2 },
    cursorColor: { default: "#fff" },
    maskColor: { default: "#fff" },
    lazy: { type: [Boolean, Object], default: !0 },
    skeleton: { type: [Boolean, Object], default: !0 },
    skeletonColor: { default: "#232323" },
    interact: { type: [Boolean, Object], default: !0 },
    fade: { type: [Boolean, Object], default: !0 }
  },
  emits: [
    "onInit",
    "onFetched",
    "onReady",
    "onPlay",
    "onPause",
    "onFinish",
    "onClick"
  ],
  setup(a, { expose: e, emit: t }) {
    const i = a, s = d(!1), h = d(null);
    $(async () => {
      i.lazy ? (tt(h.value, f), _(async () => {
        s.value && await b();
      })) : await b();
    }), U(() => {
      i.lazy && et(), o && o.pause();
    });
    function f() {
      s.value = !0;
    }
    const m = d(null), l = d(!1);
    let o, c;
    async function b() {
      l.value || (r("onInit", !0), await S(), await x(), l.value = !0, r("onReady", l.value));
    }
    async function S() {
      o = new Q(i), await o.fetchAudioFile(), r("onFetched", !0), await o.setupAudio(), P();
    }
    async function x() {
      c = new J(
        m.value,
        i,
        o._filteredData
      ), c.setupCanvas(), _(() => {
        c._props = i, c.setWaveStyle(g.value);
      });
    }
    const p = d(0), v = d(0), g = d(0);
    function C() {
      !o._playing || (requestAnimationFrame(C), v.value = o._currentTime, g.value = v.value / o._audioDuration * c._canvas.width);
    }
    function R(u) {
      !l.value || !i.interact || (u.layerX <= 0 ? p.value = 0 : u.layerX >= c._canvas.width ? p.value = c._canvas.width : p.value = u.layerX);
    }
    function B() {
      if (!l.value || !i.interact)
        return;
      g.value = p.value;
      const u = p.value / c._canvas.width * o._audioDuration;
      o.pick(u), v.value = u, r("onClick", h), r("onFinish", !1);
    }
    function T() {
      !l.value || (o.play(), r("onPlay", !0), C());
    }
    function W() {
      o.replay(), r("onFinish", !1), r("onPlay", !0), C();
    }
    function M() {
      o.pause(), r("onPause", !1);
    }
    function F() {
      o.finish(), r("onPlay", !1), r("onFinish", !0);
    }
    function O(u) {
      o.setPlaybackRate(u);
    }
    function P() {
      _(() => {
        v.value <= o._audioDuration || F();
      });
    }
    function z() {
      return N(v.value);
    }
    function I() {
      const u = o._audioDuration;
      return N(u);
    }
    const r = t;
    return e({
      play: T,
      pause: M,
      replay: W,
      getCurrentTime: z,
      getDuration: I,
      setPlaybackRate: O
    }), (u, nt) => (X(), j("section", {
      id: "illest-waveform",
      ref_key: "__illestWaveformRef__",
      ref: h,
      style: y(`${l.value && a.interact ? "cursor: pointer" : ""}`),
      onMousemove: R,
      onClick: B
    }, [
      H(q, { name: "fade" }, {
        default: Y(() => [
          w(A("div", {
            id: "illest-waveform__skeleton",
            style: y(`background-color: ${a.skeletonColor}`)
          }, [
            w(A("div", {
              id: "illest-waveform__skeleton__load",
              style: y(`background-color: ${a.skeletonColor}`)
            }, null, 4), [
              [k, !l.value]
            ])
          ], 4), [
            [k, i.skeleton && !l.value]
          ])
        ]),
        _: 1
      }),
      A("canvas", {
        id: "illest-waveform__view",
        ref_key: "waveRef",
        ref: m
      }, null, 512),
      w(A("div", {
        id: "illest-waveform__cursor",
        style: y(`width:${i.cursorWidth}px; transform: translateX(${p.value}px);background-color: ${i.cursorColor}; `)
      }, null, 4), [
        [k, l.value && i.interact]
      ])
    ], 36));
  }
});
const at = (a, e) => {
  const t = a.__vccOpts || a;
  for (const [i, s] of e)
    t[i] = s;
  return t;
}, st = /* @__PURE__ */ at(it, [["__scopeId", "data-v-04478eb9"]]), ut = {
  install: (a) => {
    a.component("IllestWaveform", st);
  }
};
export {
  st as IllestWaveform,
  ut as default
};
