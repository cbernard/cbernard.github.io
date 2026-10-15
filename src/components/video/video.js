// Loading starts this far ahead of the viewport, so the clip is ready when it
// scrolls in.
const LOAD_MARGIN = "50% 0px";

// Apple browsers take the mp4: its H.264 is decoded in hardware on every one of
// their devices, where an iPhone may hold back the autoplay of the VP9 webm.
const isApple = /^Apple/.test(navigator.vendor);

export default function video() {
  return {
    loaded: false,
    visible: false,
    observer: null,

    init() {
      // Safari only autoplays a clip it reads as muted, and a clip that Swup
      // parses into the page can carry the attribute without the property.
      this.$el.muted = true;

      // Safari turns down a `play()` made while the page is still coming in:
      // each of these gives it another go.
      this.retry = () => this.visible && this.start();
      this.$el.addEventListener("canplay", this.retry);
      this.$el.addEventListener("loadeddata", this.retry);
      document.addEventListener("touchstart", this.retry, { passive: true });
      document.addEventListener("pointerdown", this.retry);

      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.visible = entry.isIntersecting;

          if (this.visible) {
            this.play();
          } else {
            this.$el.pause();
          }
        },
        { rootMargin: LOAD_MARGIN },
      );

      this.observer.observe(this.$el);
    },

    play() {
      if (!this.loaded) {
        this.$el.querySelectorAll("source").forEach((source) => {
          if (isApple && source.type === "video/webm") {
            source.remove();
            return;
          }

          source.src = source.dataset.src;
        });

        this.$el.load();
        this.loaded = true;
      }

      this.start();
    },

    start() {
      if (!this.$el.paused) {
        return;
      }

      // Rejected when the browser refuses autoplay; the poster stays up.
      this.$el.play().catch(() => {});
    },

    destroy() {
      this.observer?.disconnect();
      this.observer = null;
      document.removeEventListener("touchstart", this.retry);
      document.removeEventListener("pointerdown", this.retry);
    },
  };
}
