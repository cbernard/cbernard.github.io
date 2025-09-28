import "number-flow";

const getProgress = (value) => {
  return parseInt(value * 100);
};

const getOffset = (progress) => {};

export default function progress() {
  return {
    progress: 0,
    offset: 0,

    init() {
      this.updateProgress(Alpine.store("navigation").scrollProgress);

      Alpine.watch(
        () => Alpine.store("navigation").scrollProgress,
        (newValue) => {
          this.updateProgress(newValue);
        },
      );
    },

    updateProgress(value) {
      this.$refs.number.update(getProgress(value));

      this.progress = value;

      this.offset = this.getOffset();
    },

    getOffset() {
      const split = progress > 0.5 ? 1 : 2;

      const value =
        this.progress * window.innerHeight -
        this.$refs.number?.clientHeight / split;

      return value > 0 ? `${value}px` : 0;
    },
  };
}
