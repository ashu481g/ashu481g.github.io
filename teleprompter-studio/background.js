// Background replacement: MediaPipe selfie segmentation separates you from the
// room, then the frame is composited over a blur, colour or image.

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

let segmenterPromise = null;

function loadSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import(`${VISION}/vision_bundle.mjs`);
      const fileset = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
      const create = (delegate) => ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
      try {
        return await create('GPU');
      } catch {
        return await create('CPU');
      }
    })().catch((err) => {
      segmenterPromise = null; // allow a retry later
      throw err;
    });
  }
  return segmenterPromise;
}

export class Compositor {
  constructor(video, canvas, { onModelState } = {}) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onModelState = onModelState || (() => {});

    this.mode = 'none';       // none | blur | color | image
    this.blur = 14;
    this.color = '#1d3557';
    this.image = null;        // HTMLImageElement or canvas

    this.segmenter = null;
    this.lastTs = 0;

    this.person = document.createElement('canvas');
    this.pctx = this.person.getContext('2d');
    this.mask = document.createElement('canvas');
    this.mctx = this.mask.getContext('2d');
    this.maskData = null;
    this.prevAlpha = null;
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.person.width = w;
    this.person.height = h;
  }

  async setMode(mode) {
    this.mode = mode;
    if (mode === 'none' || this.segmenter) return;
    this.onModelState('loading');
    try {
      this.segmenter = await loadSegmenter();
      this.onModelState('ready');
    } catch (err) {
      console.error(err);
      this.mode = 'none';
      this.onModelState('error', err);
    }
  }

  render() {
    const { video, ctx, canvas } = this;
    if (video.readyState < 2) return;
    const w = canvas.width;
    const h = canvas.height;

    if (this.mode === 'none' || !this.segmenter) {
      ctx.drawImage(video, 0, 0, w, h);
      return;
    }

    let ts = performance.now();
    if (ts <= this.lastTs) ts = this.lastTs + 1;
    this.lastTs = ts;
    try {
      this.segmenter.segmentForVideo(video, ts, (result) => {
        const m = result.confidenceMasks && result.confidenceMasks[0];
        if (m) this.updateMask(m);
      });
    } catch (err) {
      console.warn('segmentation failed for a frame', err);
    }

    if (!this.maskData) {
      ctx.drawImage(video, 0, 0, w, h);
      return;
    }

    this.drawBackground(w, h);

    // Cut the person out of the frame using the (softened) mask.
    const p = this.pctx;
    p.globalCompositeOperation = 'copy';
    p.filter = 'blur(3px)';
    p.drawImage(this.mask, 0, 0, w, h);
    p.filter = 'none';
    p.globalCompositeOperation = 'source-in';
    p.drawImage(video, 0, 0, w, h);
    p.globalCompositeOperation = 'source-over';

    ctx.drawImage(this.person, 0, 0);
  }

  updateMask(mask) {
    const mw = mask.width;
    const mh = mask.height;
    const conf = mask.getAsFloat32Array();

    if (this.mask.width !== mw || this.mask.height !== mh || !this.maskData) {
      this.mask.width = mw;
      this.mask.height = mh;
      this.maskData = this.mctx.createImageData(mw, mh);
      this.prevAlpha = new Float32Array(mw * mh);
    }

    const px = this.maskData.data;
    const prev = this.prevAlpha;
    for (let i = 0; i < conf.length; i++) {
      let a = (conf[i] - 0.25) * 2;           // sharpen the edge a little
      a = a < 0 ? 0 : a > 1 ? 1 : a;
      a = prev[i] * 0.35 + a * 0.65;          // smooth flicker between frames
      prev[i] = a;
      px[i * 4 + 3] = a * 255;
    }
    this.mctx.putImageData(this.maskData, 0, 0);
  }

  drawBackground(w, h) {
    const { ctx } = this;
    if (this.mode === 'blur') {
      const b = this.blur;
      ctx.filter = `blur(${b}px)`;
      ctx.drawImage(this.video, -b * 2, -b * 2, w + b * 4, h + b * 4);
      ctx.filter = 'none';
    } else if (this.mode === 'image' && this.image) {
      drawCover(ctx, this.image, w, h);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

function drawCover(ctx, img, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

// ---- Built-in backgrounds, drawn in code so the app needs no image files ----

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function makePresetBackgrounds(w = 1920, h = 1080) {
  const make = (name, paint) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d'));
    return { name, canvas: c };
  };

  return [
    make('Studio', (g) => {
      const grad = g.createRadialGradient(w * 0.5, h * 0.45, h * 0.05, w * 0.5, h * 0.5, w * 0.7);
      grad.addColorStop(0, '#3a5f8f');
      grad.addColorStop(0.55, '#1c2f4d');
      grad.addColorStop(1, '#0b1322');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }),
    make('Charcoal', (g) => {
      const grad = g.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, w * 0.65);
      grad.addColorStop(0, '#4a4f57');
      grad.addColorStop(1, '#16181c');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }),
    make('Sunset', (g) => {
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#f6a35c');
      grad.addColorStop(0.5, '#d9667b');
      grad.addColorStop(1, '#5b3f8c');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }),
    make('Bokeh', (g) => {
      g.fillStyle = '#10141f';
      g.fillRect(0, 0, w, h);
      const rnd = seeded(42);
      const colors = ['255,209,102', '255,170,90', '120,190,255', '255,255,255'];
      g.filter = 'blur(6px)';
      for (let i = 0; i < 70; i++) {
        const r = h * (0.02 + rnd() * 0.07);
        const x = rnd() * w;
        const y = rnd() * h;
        const col = colors[Math.floor(rnd() * colors.length)];
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${col},${0.25 + rnd() * 0.35})`);
        grad.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      g.filter = 'none';
    }),
    make('Light', (g) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#f4f1ea');
      grad.addColorStop(1, '#d9d4c7');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.035)';
      for (let x = 0; x < w; x += w / 8) g.fillRect(x, 0, 2, h);
    }),
  ];
}
