// A field of horizontal lines, like a swell seen from above. The "404" lifts
// them from underneath and the pointer drags a bump through them. Each line
// hides the ones above it, so the relief reads without any shading.

const STEP = 5;
// Line gap, relief and pointer bump, as shares of the "404" font size, so the
// figure reads the same on a phone and on a large screen.
const GAP = 1 / 38;
const RELIEF = 1 / 10.5;
const BUMP = 1 / 24;
const BUMP_RADIUS = 1 / 3;

// Lines fade from this opacity when flat to full ink at the top of a crest.
const INK_FLAT = 0.14;

// How fast the bump catches up with the pointer, per second.
const FOLLOW = 3;

const smooth = (value) => value * value * (3 - 2 * value);

export default function field() {
  // Per line, the relief of the "404" sampled every STEP pixels.
  let relief = [];
  const pointer = { x: -1e4, y: -1e4 };
  const bump = { x: -1e4, y: -1e4, strength: 0 };

  return {
    init() {
      this.canvas = this.$refs.canvas;
      this.context = this.canvas.getContext("2d");

      this.onResize = () => this.resize();
      window.addEventListener("resize", this.onResize);

      this.$el.addEventListener("pointermove", (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;

        if (bump.x < -1e3) {
          bump.x = pointer.x;
          bump.y = pointer.y;
        }
      });
      this.$el.addEventListener("pointerleave", () => {
        pointer.x = pointer.y = -1e4;
      });

      // The webfont has to be there before the "404" is drawn into the mask.
      document.fonts.ready.then(() => this.resize());
      this.resize();

      this.last = performance.now();
      this.frame = requestAnimationFrame((time) => this.tick(time));
    },

    destroy() {
      cancelAnimationFrame(this.frame);
      window.removeEventListener("resize", this.onResize);
    },

    resize() {
      const ratio = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.width = width;
      this.height = height;
      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const mask = document.createElement("canvas");
      mask.width = width;
      mask.height = height;

      const maskContext = mask.getContext("2d", { willReadFrequently: true });
      const family = getComputedStyle(document.body).fontFamily;

      // Sized on the measured width of the figure, capped by the height.
      maskContext.font = `100px ${family}`;
      const perPixel = maskContext.measureText("404").width / 100;
      const size = Math.min(
        (width * (width < height ? 0.74 : 0.52)) / perPixel,
        height * 0.58,
      );

      this.gap = Math.max(6, size * GAP);
      this.relief = size * RELIEF;
      this.bump = size * BUMP;
      this.bumpRadius = Math.max(70, size * BUMP_RADIUS);

      maskContext.filter = `blur(${Math.round(size / 22)}px)`;
      maskContext.fillStyle = "#000";
      maskContext.textAlign = "center";
      maskContext.textBaseline = "middle";
      maskContext.font = `${size}px ${family}`;
      maskContext.fillText("404", width / 2, height * 0.47);

      const { data } = maskContext.getImageData(0, 0, width, height);

      relief = [];

      // Runs past the bottom edge: the swell and the bump lift those lines in.
      for (let y = this.gap / 2; y < height + this.bump; y += this.gap) {
        const row = [];
        const rowY = Math.min(Math.round(y), height - 1);

        for (let x = 0; x <= width; x += STEP) {
          const alpha =
            data[(rowY * width + Math.min(x, width - 1)) * 4 + 3] / 255;
          row.push(smooth(alpha));
        }

        relief.push({ y, row });
      }
    },

    tick(now) {
      const delta = Math.min((now - this.last) / 1000, 0.05);
      const time = now / 1000;
      this.last = now;

      const { context, width, height } = this;
      const styles = getComputedStyle(document.body);

      // Re-read every frame: the theme switcher swaps the ink.
      const [r, g, b] = styles.color.match(/\d+/g).map(Number);
      const ink = (alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

      const follow = 1 - Math.exp(-FOLLOW * delta);
      const active = pointer.x > -1e3;
      bump.x += (pointer.x - bump.x) * follow;
      bump.y += (pointer.y - bump.y) * follow;
      bump.strength += ((active ? 1 : 0) - bump.strength) * follow;

      context.clearRect(0, 0, width, height);
      context.lineWidth = 0.75;
      context.lineJoin = "round";
      context.fillStyle = styles.backgroundColor;

      relief.forEach(({ y, row }, index) => {
        const heights = [];

        context.beginPath();

        row.forEach((lift, column) => {
          const x = column * STEP;

          // Two slow swells, slightly out of phase from one line to the next.
          const swell =
            3 * Math.sin(x * 0.009 + time * 0.9 + index * 0.28) +
            1.5 * Math.sin(x * 0.023 - time * 0.6 + index * 0.11);

          // A light grain on the letters, so the relief is not too clean.
          const grain = 1 + 0.12 * Math.sin(x * 0.05 + index * 0.9 + time);

          const dx = x - bump.x;
          const dy = y - bump.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const falloff = Math.exp(
            -(distance * distance) / (2 * this.bumpRadius * this.bumpRadius),
          );
          const ripple = Math.sin(distance * 0.04 - time * 2) * 0.15 + 0.85;
          const push = this.bump * bump.strength * falloff * ripple;

          const offset = swell + lift * this.relief * grain + push;
          heights.push(offset);

          if (column === 0) {
            context.moveTo(x, y - offset);
          } else {
            context.lineTo(x, y - offset);
          }
        });

        const gradient = context.createLinearGradient(0, 0, width, 0);

        for (let column = 0; column < heights.length; column += 6) {
          const crest = Math.min(1, Math.max(0, heights[column] / this.relief));
          const alpha = INK_FLAT + (1 - INK_FLAT) * crest;
          gradient.addColorStop(
            Math.min(1, (column * STEP) / width),
            ink(alpha.toFixed(3)),
          );
        }

        context.lineTo(width, height);
        context.lineTo(0, height);
        context.closePath();
        context.fill();

        // Stroked after the fill, on the same path minus the closing edges.
        context.beginPath();
        row.forEach((_, column) => {
          const x = column * STEP;
          if (column === 0) {
            context.moveTo(x, y - heights[column]);
          } else {
            context.lineTo(x, y - heights[column]);
          }
        });
        context.strokeStyle = gradient;
        context.stroke();
      });

      this.frame = requestAnimationFrame((next) => this.tick(next));
    },
  };
}
