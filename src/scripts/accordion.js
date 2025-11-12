import { ScrollTrigger } from "gsap/ScrollTrigger";
import scrollInstance from "./scroll";

export default function accordion() {
  return {
    defaultHeight: 78,
    current: Alpine.store("navigation").current,
    offset: null,
    currentHeight: null,
    visible: 5,
    works: null,
    ready: false,

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
        () => {
          Alpine.store("navigation").current = this.current;
          this.setWrapperOffset();
          this.setCurrentWorkHeight();
        },
      );
    },

    addEventListeners() {
      window.addEventListener("resize", this.onResize, { passive: true });
      window.addEventListener("keydown", this.onKeyDown);
      this.$refs.container.addEventListener(
        "transitionend",
        this.onTransitionEnd,
      );
    },

    removeEventListeners() {
      window.removeEventListener("resize", this.onResize, { passive: true });
      window.removeEventListener("keydown", this.onKeyDown);
      this.$refs.container.removeEventListener(
        "transitionend",
        this.onTransitionEnd,
      );
    },

    handleResize() {
      this.setWrapperOffset();
      this.setCurrentWorkHeight();
    },

    handleKeyDown(e) {
      if (e.key === "ArrowDown") {
        this.scrollToNext();
      } else if (e.key === "ArrowUp") {
        this.scrollToPrevious();
      }
    },

    handleTransitionEnd() {
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
          id: `accordion-${index}`,
          refreshPriority: -1,
        });
      });
    },

    scrollToNext() {
      if (this.current < this.works.length - 1) {
        scrollInstance.scrollTo(
          ((this.current + 1) * window.innerHeight) / this.visible + 1,
          { immediate: true },
        );
      }
    },

    scrollToPrevious() {
      if (this.current > 0) {
        scrollInstance.scrollTo(
          ((this.current - 1) * window.innerHeight) / this.visible + 1,
          { immediate: true },
        );
      }
    },

    goTo(index) {
      if (
        index === this.current ||
        index < 0 ||
        index > this.works.length - 1
      ) {
        return;
      }

      this.current = index;
    },

    setCurrentWorkHeight() {
      if (this.current === 0) {
        this.currentHeight =
          this.$refs.container.clientHeight -
          this.$refs.headline.clientHeight -
          this.defaultHeight * (this.visible / 2);

        return;
      }

      if (this.current > this.works.length - 1 - Math.ceil(this.visible / 2)) {
        this.currentHeight =
          this.$refs.container.clientHeight -
          this.defaultHeight *
            (this.visible - 0.5 + (this.works.length - 2 - this.current - 1));

        return;
      }

      this.currentHeight =
        this.$refs.container.clientHeight - this.defaultHeight * this.visible;
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

    destroy() {
      this.removeEventListeners();
      ScrollTrigger.killAll();
    },
  };
}
