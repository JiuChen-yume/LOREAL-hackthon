Component({
  properties: { activeKey: { type: String, value: "home" } },
  data: { items: [] },
  lifetimes: { attached() {
    this.refreshItems();
  } },
  observers: { activeKey() {
    this.refreshItems();
  } },
  methods: {
    refreshItems() {
      const icon = (name) => `/assets/tab-${name}.png`;
      const all = {
        home: { key: "home", label: "\u9996\u9875", glyph: "\u2302", icon: icon("home"), url: "/pages/home/home" },
        vanity: { key: "vanity", label: "\u5316\u5986\u53F0", glyph: "\u25A4", icon: icon("vanity"), url: "/pages/vanity/vanity" },
        care: { key: "care", label: "AI\u966A\u4F34", glyph: "\u2726", icon: icon("care"), url: "/pages/care/care" },
        makeup: { key: "makeup", label: "\u5986\u9020", glyph: "\u2727", icon: icon("care"), url: "/pages/makeup/makeup" },
        skin: { key: "skin", label: "\u808C\u80A4\u8BB0\u5FC6", glyph: "\u25A5", icon: icon("vanity"), url: "/pages/skin/skin" },
        store: { key: "store", label: "\u5546\u57CE", glyph: "\u25A2", icon: icon("store"), url: "/pages/store/store" },
        cycle: { key: "cycle", label: "\u7F8E\u4E3D\u5FAA\u73AF", glyph: "\u25CC", icon: icon("cycle"), url: "/pages/cycle/cycle" },
        profile: { key: "profile", label: "\u6211\u7684", glyph: "\u2659", icon: icon("vanity"), url: "/pages/skin/skin" },
        analysis: { key: "analysis", label: "\u808C\u80A4\u5206\u6790", glyph: "\u25C9", icon: icon("vanity"), url: "/pages/skin/skin" },
        advisor: { key: "advisor", label: "AI\u7F8E\u5986\u987E\u95EE", glyph: "\u2726", icon: icon("care"), url: "/pages/makeup/makeup" },
        diagnostic: { key: "diagnostic", label: "AI\u8BCA\u65AD", glyph: "\u25C9", icon: icon("care"), url: "/pages/skin/skin" }
      };
      const layouts = {
        home: ["home", "cycle", "care", "store", "profile"],
        vanity: ["home", "vanity", "care", "profile"],
        care: ["home", "diagnostic", "care", "vanity", "profile"],
        makeup: ["home", "care", "makeup", "cycle", "profile"],
        skin: ["home", "care", "analysis", "skin", "profile"],
        store: ["home", "diagnostic", "store", "vanity", "profile"],
        cycle: ["home", "analysis", "advisor", "cycle", "profile"]
      };
      const order = ["home", "vanity", "care", "makeup", "store", "cycle", "profile"];
      this.setData({ items: order.map((key) => all[key]) });
    },
    handleTap(e) {
      wx.reLaunch({ url: e.currentTarget.dataset.url });
    }
  }
});
