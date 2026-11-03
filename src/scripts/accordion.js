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
      this.removeSwipeFilter = scrollInstance.setVirtualScrollFilter(
        this.handleSwipe.bind(this),
      );

      // In portrait the hero leaves the list too short for the desktop items,
      // whatever the width.
      this.isCompact = window.matchMedia("(orientation: portrait)");

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
      this.itemHeight = this.isCompact.matches ? 48 : 78;
      this.visible = this.isCompact.matches ? 5 : 6;
    },

    updatePositions() {
      const getTopPosition = (index) => {
        if (this.current === 1 && index === 0) {
          return 0;
        }

        if (this.current <= this.visible / 2) {
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

    // Read off the spacers: their height differs between orientations, and the
    // extra pixel puts the scroll past the start of their trigger. Rounded up
    // first, as Safari floors a fractional scroll back under that start.
    getScrollPosition(index) {
      const spacer =
        this.$refs.scrollable.querySelectorAll(":scope > div")[index];

      return (
        Math.ceil(spacer.getBoundingClientRect().top + scrollInstance.scrollY) +
        1
      );
    },

    // `current` is restored from the store on mount, but the scroll is back at
    // the top: without this the ScrollTriggers snap it back to the first item.
    syncScrollPosition() {
      scrollInstance.scrollTo(this.getScrollPosition(this.current), {
        immediate: true,
      });
    },

    // CSS transitions stay off until the first paint, or a Swup remount
    // animates the items into place.
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
      } else if (e.key === "Enter") {
        this.open(e);
      }
    },

    // In portrait a swipe moves one project, and a flick a few more.
    handleSwipe({ deltaY, event }) {
      if (!this.isCompact.matches || !event.type.startsWith("touch")) {
        return true;
      }

      if (event.type === "touchstart") {
        this.swipe = { distance: 0, direction: 0, samples: [] };
        return false;
      }

      if (!this.swipe) {
        return false;
      }

      if (event.type === "touchmove") {
        if (event.cancelable) {
          event.preventDefault();
        }

        this.swipe.distance += deltaY;
        this.swipe.samples.push({ deltaY, time: event.timeStamp });

        // In pixels, enough to tell a swipe from a tap that drifts.
        if (!this.swipe.direction && Math.abs(this.swipe.distance) > 30) {
          this.swipe.direction = Math.sign(this.swipe.distance);
          this.moveTo(this.current + this.swipe.direction);
        }
      } else if (event.type === "touchend" && this.swipe.direction) {
        // Over the last 100ms, so a flick that slows down before the release
        // still counts as one.
        const recent = this.swipe.samples.filter(
          ({ time }) => event.timeStamp - time < 100,
        );
        const velocity =
          recent.reduce((sum, { deltaY }) => sum + deltaY, 0) / 100;

        // One more project per px/ms, at most 4: a slow drag stays at one.
        const extra = Math.min(
          4,
          Math.floor(Math.max(0, velocity * this.swipe.direction)),
        );

        this.moveTo(this.current + extra * this.swipe.direction);
        this.swipe = null;
      }

      return false;
    },

    moveTo(index) {
      this.scrollTo(Math.min(Math.max(index, 0), this.items.length - 1));
    },

    // A focused link or button already acts on Enter by itself.
    open(e) {
      if (
        e.repeat ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.target.closest?.("a, button, input, textarea, select")
      ) {
        return;
      }

      this.items[this.current]?.querySelector("a")?.click();
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
      this.removeSwipeFilter();
      ScrollTrigger.killAll();
    },
  };
}
