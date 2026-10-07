// Loading starts this far ahead of the viewport, so the clip is ready when it
// scrolls in.
const LOAD_MARGIN = "50% 0px";

export default function video() {
  return {
    loaded: false,
    observer: null,

    init() {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
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
          source.src = source.dataset.src;
        });

        this.$el.load();
        this.loaded = true;
      }

      // Rejected when the browser refuses autoplay; the poster stays up.
      this.$el.play().catch(() => {});
    },

    destroy() {
      this.observer?.disconnect();
      this.observer = null;
    },
  };
}
