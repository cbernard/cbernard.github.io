import "number-flow";

export default function progress() {
  return {
    progress: 0,
    offset: 0,
    watcher: null,

    init() {
      this.$refs.number.format = {
        minimumIntegerDigits: 2,
      };
      this.updateProgress(Alpine.store("navigation").scrollProgress);

      this.watcher = this.$watch(
        () => Alpine.store("navigation").scrollProgress,
        (newValue) => {
          this.updateProgress(newValue);
        },
      );
    },

    updateProgress(value) {
      this.$refs.number?.update(parseInt(value * 100));
      this.progress = value;
      this.offset = this.getOffset();
    },

    getOffset() {
      const split = progress > 0.5 ? 1 : 2;

      const value =
        this.progress * this.$refs.container?.clientHeight -
        this.$refs.number?.clientHeight / split;

      return value > 0 ? `${value}px` : 0;
    },

    destroy() {
      this.watcher = null;
    },
  };
}
