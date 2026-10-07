export default function email() {
  return {
    address: "",
    label: "",

    init() {
      const { user, domain } = this.$el.dataset;
      this.address = `${user}@${domain}`;
      // Shown without the `+tag`, which only serves to sort the inbox.
      this.label = `${user.split("+")[0]}@${domain}`;
    },
  };
}
