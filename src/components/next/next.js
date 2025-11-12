import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function next() {
  return {
    progress: 0,

    init() {
      gsap.set(".test", {
        opacity: 0,
      });

      ScrollTrigger.create({
        trigger: ".test",
        start: "bottom bottom-=40px",
        end: "+=300",
        toggleActions: "play none none reverse",
        markers: true,
        pin: true,
        onUpdate: (self) => (this.progress = `${self.progress * 100}%`),
        onLeave: () => {},
        animation: gsap.to(".test", {
          opacity: 1,
          duration: 0.2,
          delay: 0.2,
        }),
      });
    },

    destroy() {
      ScrollTrigger.killAll();
    },
  };
}
