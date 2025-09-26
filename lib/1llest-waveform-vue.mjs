var M = Object.defineProperty;
var P = (a, t, e) => t in a ? M(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var s = (a, t, e) => (P(a, typeof t != "symbol" ? t + "" : t, e), e);
import { defineComponent as G, ref as d, onMounted as $, watchEffect as w, onUnmounted as V, openBlock as U, createElementBlock as X, normalizeStyle as m, createVNode as j, Transition as H, withCtx as q, withDirectives as A, createElementVNode as _, vShow as k } from "vue";
class Y {
  constructor(t, e, i) {
    s(this, "canvasCtx");
    var n;
    this.canvas = t, this.props = e, this.filteredData = i, this.canvas = t, this.canvasCtx = (n = this.canvas) == null ? void 0 : n.getContext("2d"), this.props = e, this.filteredData = i;
  }
  get _canvas() {
    return this.canvas;
  }
  set _props(t) {
    this.props = t;
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
    const { canvas: t, canvasCtx: e, filteredData: i } = this;
    i.forEach((n, h) => {
      const f = t.width / i.length, v = f * h - f / 2;
      e.moveTo(
        v,
        t.height / 2 - Math.abs(n) * t.height * 0.4
      ), e.lineTo(
        v,
        t.height / 2 + Math.abs(n) * t.height * 0.4
      );
    });
  }
  drawMask(t) {
    const { canvas: e, canvasCtx: i, props: n } = this;
    i.globalCompositeOperation = "destination-atop", i.fillStyle = n.maskColor, i.fillRect(0, 0, t, e.height);
  }
  drawWave() {
    const { canvasCtx: t, props: e } = this;
    t.lineWidth = e.lineWidth, t.lineCap = e.lineCap, t.strokeStyle = e.lineColor, t.stroke();
  }
  setWaveStyle(t) {
    const { canvas: e, canvasCtx: i } = this;
    i.clearRect(0, 0, e.width, e.height), this.drawMask(t), this.drawWave();
  }
}
class J {
  constructor(t) {
    s(this, "props");
    s(this, "audioCtx");
    s(this, "audioBuffer");
    s(this, "gainNode");
    s(this, "filteredData");
    s(this, "arrayBuffer");
    this.props = t, this.audioCtx = new AudioContext();
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
    await this.createAudioBuffer(), this.createFilterData(), this.createGainNode();
  }
  async fetchAudioFile() {
    try {
      const t = await fetch(this.props.url, this.props.requestOptions);
      this.arrayBuffer = await t.arrayBuffer();
    } catch (t) {
      console.error(t);
    }
  }
  async createAudioBuffer() {
    this.audioBuffer = await this.audioCtx.decodeAudioData(this.arrayBuffer);
  }
  createGainNode() {
    this.gainNode = this.audioCtx.createGain(), this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
  }
  createFilterData() {
    const t = this.props.samplingRate, e = [], i = this.audioBuffer.getChannelData(0);
    for (let n = 0; n < t; n++) {
      const h = Math.floor(i.length / t), f = i[n * h];
      e.push(f);
    }
    this.filteredData = e;
  }
}
function K(a) {
  return new Promise((t) => setTimeout(t, a));
}
class Q extends J {
  constructor(e) {
    super(e);
    s(this, "startAt");
    s(this, "pauseAt");
    s(this, "pickAt");
    s(this, "playing");
    s(this, "audioBufferSourceNode");
    s(this, "FADE_DURATION");
    s(this, "playbackRate");
    this.startAt = 0, this.pauseAt = 0, this.pickAt = 0, this.playing = !1, this.FADE_DURATION = this.props.fade ? 0.08 : 0, this.playbackRate = 1;
  }
  get _playing() {
    return this.playing;
  }
  get _currentTime() {
    return this.pauseAt ? this.pauseAt : this.startAt ? this.audioCtx.currentTime - this.startAt : this.audioCtx.currentTime;
  }
  play() {
    this.disconnectDestination(), this.createAudioBufferSourceNode(), this.connectDestination();
    const e = this.pickAt ? this.pickAt : this.pauseAt;
    this.audioBufferSourceNode.start(0, e), this.startAt = this.audioCtx.currentTime - e, this.pauseAt = 0, this.playing = !0, this.props.fade ? (this.setGainValue(0), this.setGainLinearRamp(1)) : this.setGainValue(1);
  }
  async pause() {
    const e = this.audioCtx.currentTime - this.startAt;
    this.props.fade && (this.setGainLinearRamp(0), await K(this.FADE_DURATION * 1e3)), this.disconnectDestination(), this.initializeState(), this.pauseAt = e + this.FADE_DURATION;
  }
  pick(e) {
    this.pickAt = e, this.playing && (this.disconnectDestination(), this.play());
  }
  replay() {
    this.audioBufferSourceNode && (this.disconnectDestination(), this.initializeState()), this.play();
  }
  finish() {
    this.pauseAt = 0, this.disconnectDestination(), this.initializeState();
  }
  setPlaybackRate(e) {
    this.playbackRate = e, this.audioBufferSourceNode && (this.audioBufferSourceNode.playbackRate.value = e);
  }
  initializeState() {
    this.playing = !1, this.startAt = 0, this.pauseAt = 0, this.pickAt = 0;
  }
  createAudioBufferSourceNode() {
    this.audioBufferSourceNode || (this.audioBufferSourceNode = this.audioCtx.createBufferSource(), this.audioBufferSourceNode.buffer = this.audioBuffer, this.audioBufferSourceNode.playbackRate.value = this.playbackRate);
  }
  connectDestination() {
    !this.audioBufferSourceNode || (this.audioBufferSourceNode.connect(this.gainNode), this.gainNode.connect(this.audioCtx.destination));
  }
  disconnectDestination() {
    !this.audioBufferSourceNode || (this.audioBufferSourceNode.disconnect(), this.audioBufferSourceNode.stop(), this.audioBufferSourceNode = null);
  }
  setGainValue(e) {
    this.gainNode.gain.setValueAtTime(e, this.audioCtx.currentTime);
  }
  setGainLinearRamp(e) {
    this.gainNode.gain.linearRampToValueAtTime(
      e,
      this.audioCtx.currentTime + this.FADE_DURATION
    );
  }
}
function x(a) {
  const t = Math.floor(a / 60), e = Math.floor(a % 60);
  return `${t}:${e < 10 ? "0" : ""}${e}`;
}
class Z {
  constructor(t, e) {
    s(this, "el");
    s(this, "handler");
    s(this, "intersectionObserver");
    s(this, "timer");
    s(this, "rended");
    this.el = t, this.handler = e, this.timer = null, this.rended = !1;
  }
  observe() {
    const t = (e) => {
      if (this.rended)
        return this.unobserve();
      const i = e[0], n = 260;
      i.intersectionRatio > 0 ? this.timer = setTimeout(() => {
        this.handler(), this.rended = !0;
      }, n) : this.timer && (clearTimeout(this.timer), this.timer = null);
    };
    this.intersectionObserver = new IntersectionObserver(t), this.intersectionObserver.observe(this.el);
  }
  unobserve() {
    this.intersectionObserver.unobserve(this.el);
  }
}
let b;
function tt(a, t) {
  b = new Z(a, t), b.observe();
}
function et() {
  b.unobserve();
}
const it = /* @__PURE__ */ G({
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
  setup(a, { expose: t, emit: e }) {
    const i = a, n = d(!1), h = d(null);
    $(async () => {
      i.lazy ? (tt(h.value, f), w(async () => {
        n.value && await D();
      })) : await D();
    }), V(() => {
      i.lazy && et(), o && o.pause();
    });
    function f() {
      n.value = !0;
    }
    const v = d(null), l = d(!1);
    let o, c;
    async function D() {
      l.value || (r("onInit", !0), await B(), await N(), l.value = !0, r("onReady", l.value));
    }
    async function B() {
      o = new Q(i), await o.fetchAudioFile(), r("onFetched", !0), await o.setupAudio(), z();
    }
    async function N() {
      c = new Y(
        v.value,
        i,
        o._filteredData
      ), c.setupCanvas(), w(() => {
        c._props = i, c.setWaveStyle(C.value);
      });
    }
    const p = d(0), y = d(0), C = d(0);
    function g() {
      !o._playing || (requestAnimationFrame(g), y.value = o._currentTime, C.value = y.value / o._audioDuration * c._canvas.width);
    }
    function R(u) {
      !l.value || !i.interact || (u.layerX <= 0 ? p.value = 0 : u.layerX >= c._canvas.width ? p.value = c._canvas.width : p.value = u.layerX);
    }
    function S() {
      if (!l.value || !i.interact)
        return;
      C.value = p.value;
      const u = p.value / c._canvas.width * o._audioDuration;
      o.pick(u), y.value = u, r("onClick", h), r("onFinish", !1);
    }
    function T() {
      !l.value || (o.play(), r("onPlay", !0), g());
    }
    function W() {
      o.replay(), r("onFinish", !1), r("onPlay", !0), g();
    }
    function O() {
      o.pause(), r("onPause", !1);
    }
    function F() {
      o.finish(), r("onPlay", !1), r("onFinish", !0);
    }
    function I(u) {
      o.setPlaybackRate(u);
    }
    function z() {
      w(() => {
        y.value <= o._audioDuration || F();
      });
    }
    function E() {
      return x(y.value);
    }
    function L() {
      const u = o._audioDuration;
      return x(u);
    }
    const r = e;
    return t({
      play: T,
      pause: O,
      replay: W,
      getCurrentTime: E,
      getDuration: L,
      setPlaybackRate: I
    }), (u, nt) => (U(), X("section", {
      id: "illest-waveform",
      ref_key: "__illestWaveformRef__",
      ref: h,
      style: m(`${l.value && a.interact ? "cursor: pointer" : ""}`),
      onMousemove: R,
      onClick: S
    }, [
      j(H, { name: "fade" }, {
        default: q(() => [
          A(_("div", {
            id: "illest-waveform__skeleton",
            style: m(`background-color: ${a.skeletonColor}`)
          }, [
            A(_("div", {
              id: "illest-waveform__skeleton__load",
              style: m(`background-color: ${a.skeletonColor}`)
            }, null, 4), [
              [k, !l.value]
            ])
          ], 4), [
            [k, i.skeleton && !l.value]
          ])
        ]),
        _: 1
      }),
      _("canvas", {
        id: "illest-waveform__view",
        ref_key: "waveRef",
        ref: v
      }, null, 512),
      A(_("div", {
        id: "illest-waveform__cursor",
        style: m(`width:${i.cursorWidth}px; transform: translateX(${p.value}px);background-color: ${i.cursorColor}; `)
      }, null, 4), [
        [k, l.value && i.interact]
      ])
    ], 36));
  }
});
const at = (a, t) => {
  const e = a.__vccOpts || a;
  for (const [i, n] of t)
    e[i] = n;
  return e;
}, st = /* @__PURE__ */ at(it, [["__scopeId", "data-v-04478eb9"]]), ut = {
  install: (a) => {
    a.component("IllestWaveform", st);
  }
};
export {
  st as IllestWaveform,
  ut as default
};
