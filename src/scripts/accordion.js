import { ScrollTrigger } from "gsap/ScrollTrigger";
import scrollInstance from "./scroll";

export default function accordion() {
  return {
    defaultHeight: 78,
    current: Alpine.store("navigation").current,
    vh: window.innerHeight,
    visible: 6,
    works: null,
    ready: false,
    positions: [],

    init() {
      this.works = Array.from(this.$el.querySelectorAll(".work"));

      this.onResize = this.handleResize.bind(this);
      this.onKeyDown = this.handleKeyDown.bind(this);
      this.onTransitionEnd = this.handleTransitionEnd.bind(this);

      this.onResize();
      this.addEventListeners();

      this.$nextTick(() => {
        this.createScrolltriggerInstances();
      });

      this.$watch(
        () => this.current,
        (newValue, oldValue) => {
          Alpine.store("navigation").current = newValue;
          this.updatePositions();
        },
      );
    },

    updatePositions() {
      const getTopPosition = (index) => {
        if (this.current === 1 && index === 0) {
          return 0;
        }

        if (this.current <= this.visible / 2) {
          return this.defaultHeight * (index - 0.5);
        }

        return this.defaultHeight * (index - this.current + 2.5);
      };

      const middlePosition = this.vh / 2 - this.defaultHeight * 0.5;

      const getBottomPosition = (index) => {
        if (this.current >= this.works.length - this.visible / 2) {
          if (index === this.works.length - 1) {
            return this.vh - this.defaultHeight;
          }

          return (
            this.vh -
            this.defaultHeight * (this.visible + this.current - 3 - index)
          );
        }

        return (
          this.vh -
          this.defaultHeight * (this.visible + this.current - 2.5 - index)
        );
      };

      this.positions = this.works.map((_, index) => {
        if (index < this.current) {
          return getTopPosition(index);
        }

        if (index === this.current) {
          return middlePosition;
        }

        return getBottomPosition(index);
      });
    },

    getPosition(index) {
      return `--this-translate-y: ${this.positions[index]}px`;
    },

    addEventListeners() {
      window.addEventListener("resize", this.onResize, { passive: true });
      window.addEventListener("keydown", this.onKeyDown);
      this.$refs.wrapper.addEventListener(
        "transitionend",
        this.onTransitionEnd,
      );
    },

    removeEventListeners() {
      window.removeEventListener("resize", this.onResize, { passive: true });
      window.removeEventListener("keydown", this.onKeyDown);
      this.$refs.wrapper.removeEventListener(
        "transitionend",
        this.onTransitionEnd,
      );
    },

    handleResize() {
      this.vh = window.innerHeight;
      this.updatePositions();
    },

    handleKeyDown(e) {
      if (e.key === "ArrowDown") {
        this.scrollToNext();
      } else if (e.key === "ArrowUp") {
        this.scrollToPrevious();
      }
    },

    handleTransitionEnd(e) {
      if (!this.ready) {
        this.ready = true;
      }
    },

    createScrolltriggerInstances() {
      const triggers = Array.from(
        this.$refs.scrollable.querySelectorAll("div"),
      );
      const filteredTriggers = triggers.slice(0, this.visible * -1);

      filteredTriggers.forEach((child, index) => {
        ScrollTrigger.create({
          trigger: child,
          start: "top top",
          end: "bottom top",
          onEnter: () => {
            this.goTo(index);
          },
          onEnterBack: () => {
            this.goTo(index);
          },
          markers: true,
          refreshPriority: -1,
        });
      });
    },

    scrollToNext() {
      if (this.current < this.works.length - 1) {
        scrollInstance.scrollTo(
          ((this.current + 1) * this.vh) / this.visible + 1,
          { immediate: true },
        );
      }
    },

    scrollToPrevious() {
      if (this.current > 0) {
        scrollInstance.scrollTo(
          ((this.current - 1) * this.vh) / this.visible + 1,
          { immediate: true },
        );
      }
    },

    isValidIndex(index) {
      return index !== this.current && index >= 0 && index < this.works.length;
    },

    scrollTo(index) {
      if (!this.isValidIndex(index)) {
        return;
      }

      scrollInstance.scrollTo((index * this.vh) / this.visible + 1, {
        immediate: true,
      });
    },

    goTo(index) {
      if (!this.isValidIndex(index)) {
        return;
      }

      this.current = index;
    },

    destroy() {
      this.removeEventListeners();
      ScrollTrigger.killAll();
    },
  };
}
