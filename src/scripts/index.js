// import Alpine from "alpinejs";

Alpine.store("darkMode", {
  on: false,

  toggle() {
    this.on = !this.on;
  },
});

// Alpine.start();
