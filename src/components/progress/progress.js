import "number-flow";

export default function progress(options = { type: "scroll" }) {
  return {
    progress: 0,
    offset: 0,
    watcher: null,

    init() {
      this.$refs.number.format = {
        minimumIntegerDigits: 2,
      };

      this.updateProgress(this.updateValue);

      this.watcher = this.$watch(
        () => this.updateValue,
        (newValue) => {
          this.updateProgress(newValue);
        },
      );
    },

    get updateValue() {
      return options.type === "scroll"
        ? Alpine.store("main").scrollProgress
        : Alpine.store("main").loading;
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
