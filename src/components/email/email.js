export default function email() {
  return {
    address: "",

    init() {
      const { user, domain } = this.$el.dataset;
      this.address = `${user}@${domain}`;
    },
  };
}
