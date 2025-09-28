export default function accordion() {
  return {
    defaultHeight: 78,
    current: Alpine.store("navigation").current,
    offset: null,
    currentHeight: null,
    visible: 5,
    works: null,
    canScroll: true,
    canKeyPress: true,
    ready: false,

    init() {
      this.works = Array.from(this.$el.querySelectorAll(".work"));

      this.setWrapperOffset();
      this.setCurrentHeight();

      this.$refs.container.addEventListener("wheel", this.onScroll.bind(this), {
        passive: false,
      });

      window.addEventListener(
        "resize",
        () => {
          this.setWrapperOffset();
          this.setCurrentHeight();
        },
        { passive: true },
      );

      window.addEventListener("keydown", (e) => {
        if (!this.canKeyPress) {
          return;
        }

        if (e.key === "ArrowDown") {
          this.goToNext();
        } else if (e.key === "ArrowUp") {
          this.goToPrevious();
        }

        this.canKeyPress = false;
        setTimeout(() => {
          this.canKeyPress = true;
        }, 250);
      });

      Alpine.watch(
        () => this.current,
        () => {
          Alpine.store("navigation").current = this.current;
          this.setWrapperOffset();
          this.setCurrentHeight();
        },
      );

      this.$el.addEventListener("transitionend", () => {
        if (!this.ready) {
          this.ready = true;
        }
      });
    },

    onScroll(e) {
      e.preventDefault();

      if (!this.canScroll) {
        return;
      }

      this.canScroll = false;

      setTimeout(() => {
        this.canScroll = true;
      }, 1000);

      const direction = e.deltaY > 0 ? 1 : -1;

      if (direction === 1) {
        this.goToNext();
      } else if (direction === -1) {
        this.goToPrevious();
      }
    },

    change(value) {
      if (value === this.current) {
        return;
      }

      this.current = value;
    },

    goToNext() {
      if (this.current < this.works.length - 1) {
        this.current++;
      }
    },

    goToPrevious() {
      if (this.current > 0) {
        this.current--;
      }
    },

    setCurrentHeight() {
      if (this.current === 0) {
        this.currentHeight =
          this.$el.clientHeight -
          this.$refs.headline.clientHeight -
          this.defaultHeight * (this.visible / 2);

        return;
      }

      if (this.current > this.works.length - 1 - Math.ceil(this.visible / 2)) {
        this.currentHeight =
          this.$el.clientHeight -
          this.defaultHeight *
            (this.visible - 0.5 + (this.works.length - 2 - this.current - 1));

        return;
      }

      this.currentHeight =
        this.$el.clientHeight - this.defaultHeight * this.visible;
    },

    setWrapperOffset() {
      if (this.current < 0) {
        return;
      }

      if (this.current === 0) {
        this.offset = 0;

        return;
      }

      if (this.current === 1) {
        this.offset =
          this.$refs.headline.clientHeight * -1 -
          (this.defaultHeight / 2) * this.current;

        return;
      }

      if (this.current < this.visible - 1) {
        return;
      }

      this.offset =
        this.$refs.headline.clientHeight * -1 -
        (this.defaultHeight / 2) * this.visible -
        this.defaultHeight * (this.current - this.visible);
    },
  };
}
