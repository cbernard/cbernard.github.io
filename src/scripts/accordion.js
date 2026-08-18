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

      this.isMobile = window.matchMedia(
        "(orientation: portrait) and (max-width: 767px)",
      );

      this.setData();
      this.updatePositions();
      this.addEventListeners();

      this.$nextTick(() => {
        this.syncScrollPosition();
        this.createScrolltriggerInstances();
        this.markAsReady();
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
          console.log("test");
          return this.itemHeight * (index - 0.5);
        }

        return this.itemHeight * (index - this.current + 2.5);
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

    getScrollPosition(index) {
      return (index * this.containerHeight) / this.visible + 1;
    },

    /**
     * `current` is restored from the store on mount while the scroll is back at
     * the top. Without this, the ScrollTriggers would drag the accordion back
     * to the item matching a scroll of 0 as soon as the user scrolls down.
     */
    syncScrollPosition() {
      scrollInstance.scrollTo(this.getScrollPosition(this.current), {
        immediate: true,
      });
    },

    /**
     * The CSS transitions stay off until the items have been painted at their
     * initial position, otherwise a remount (Swup) animates them into place.
     */
    markAsReady() {
      requestAnimationFrame(() => {
        this.ready = true;
      });
    },

    addEventListeners() {
      window.addEventListener("resize", this.onResize, { passive: true });
      window.addEventListener("keydown", this.onKeyDown);
    },

    removeEventListeners() {
      window.removeEventListener("resize", this.onResize, { passive: true });
      window.removeEventListener("keydown", this.onKeyDown);
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
        scrollInstance.scrollTo(this.getScrollPosition(this.current + 1), {
          immediate: true,
        });
      }
    },

    scrollToPrevious() {
      if (this.current > 0) {
        scrollInstance.scrollTo(this.getScrollPosition(this.current - 1), {
          immediate: true,
        });
      }
    },

    isValidIndex(index) {
      return index !== this.current && index >= 0 && index < this.items.length;
    },

    scrollTo(index) {
      if (!this.isValidIndex(index)) {
        return;
      }

      scrollInstance.scrollTo(this.getScrollPosition(index), {
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
