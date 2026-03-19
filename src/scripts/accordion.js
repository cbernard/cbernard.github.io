import { ScrollTrigger } from "gsap/ScrollTrigger";
import { debounce } from "./helpers";
import scrollInstance from "./scroll";

export default function accordion() {
  return {
    itemHeight: null,
    containerHeight: null,
    items: null,
    visible: null,
    current: Alpine.store("main").current,
    ready: false,
    positions: [],

    init() {
      this.onResize = debounce(this.handleResize.bind(this), 100);
      this.onKeyDown = this.handleKeyDown.bind(this);
      this.onTransitionEnd = this.handleTransitionEnd.bind(this);

      this.isMobile = window.matchMedia(
        "(orientation: portrait) and (max-width: 767px)",
      );

      this.setData();
      this.updatePositions();
      this.addEventListeners();

      this.$nextTick(() => {
        this.createScrolltriggerInstances();
      });

      this.$watch(
        () => this.current,
        (newValue) => {
          Alpine.store("main").current = newValue;
          this.updatePositions();
        },
      );
    },

    setData() {
      this.items = Array.from(this.$el.querySelectorAll(".work"));
      this.containerHeight =
        this.$refs.container.getBoundingClientRect().height;
      this.itemHeight = this.isMobile.matches ? 48 : 78;
      this.visible = this.isMobile.matches ? 5 : 6;
    },

    updatePositions() {
      const getTopPosition = (index) => {
        if (this.current === 1 && index === 0) {
          return 0;
        }

        if (this.current <= this.visible / 2) {
          return this.itemHeight * (index - 0.5);
        }

        return this.itemHeight * (index - this.current + 1.5);
      };

      const middlePosition = this.containerHeight / 2 - this.itemHeight * 0.5;

      const getBottomPosition = (index) => {
        if (this.current >= this.items.length - this.visible / 2) {
          if (index === this.items.length - 1) {
            return this.containerHeight - this.itemHeight;
          }

          return (
            this.containerHeight -
            this.itemHeight * (this.visible + this.current - 3 - index)
          );
        }

        return (
          this.containerHeight -
          this.itemHeight * (this.visible + this.current - 2.5 - index)
        );
      };

      this.positions = this.items.map((_, index) => {
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
      this.setData();

      this.$nextTick(() => {
        this.updatePositions();
      });
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
          refreshPriority: -1,
        });
      });
    },

    scrollToNext() {
      if (this.current < this.items.length - 1) {
        scrollInstance.scrollTo(
          ((this.current + 1) * this.containerHeight) / this.visible + 1,
          { immediate: true },
        );
      }
    },

    scrollToPrevious() {
      if (this.current > 0) {
        scrollInstance.scrollTo(
          ((this.current - 1) * this.containerHeight) / this.visible + 1,
          { immediate: true },
        );
      }
    },

    isValidIndex(index) {
      return index !== this.current && index >= 0 && index < this.items.length;
    },

    scrollTo(index) {
      if (!this.isValidIndex(index)) {
        return;
      }

      scrollInstance.scrollTo(
        (index * this.containerHeight) / this.visible + 1,
        {
          immediate: true,
        },
      );
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
