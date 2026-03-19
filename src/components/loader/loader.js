import Preload from "preload-it";

export default function loader(assets = []) {
  return {
    init() {
      const preload = Preload();

      preload.onprogress = (event) => {
        Alpine.store("main").loading = (event.progress ?? 0) / 100;
      };

      preload.oncomplete = () => {
        this.onComplete();
      };

      preload.onerror = (item) => {
        console.warn("Preload error:", item);
      };

      preload.fetch(assets);
    },

    onComplete() {
      setTimeout(() => {
        Alpine.store("main").loaded = true;
      }, 2000);
    },
  };
}
