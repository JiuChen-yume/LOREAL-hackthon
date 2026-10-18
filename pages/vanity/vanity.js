var import_mock_data = require("../../services/mock-data");
var import_product_service = require("../../services/product-service");
Page({ referenceAction(e) {
  const a = e.detail.action;
  const nav = { home: "/pages/home/home", vanity: "/pages/vanity/vanity", plan: "/pages/care/care", makeup: "/pages/makeup/makeup", skin: "/pages/skin/skin", store: "/pages/store/store", cycle: "/pages/cycle/cycle" };
  if (a === "add" && this.add) {
    this.add();
    return;
  }
  if (a === "compat" && this.compat) {
    this.compat();
    return;
  }
  if (a === "generate" && this.generate) {
    this.generate();
    return;
  }
  if (a === "shopping" && this.buy) {
    this.buy();
    return;
  }
  if (a === "recycle" && this.recycle) {
    this.recycle();
    return;
  }
  if (a === "scenario") {
    wx.showActionSheet({ itemList: ["\u71AC\u591C\u4FEE\u62A4", "\u6362\u5B63\u654F\u611F", "\u91CD\u8981\u7EA6\u4F1A"] });
    return;
  }
  if (a === "home" && nav.home) {
    wx.reLaunch({ url: nav.home });
    return;
  }
  if (nav[a]) wx.reLaunch({ url: nav[a] });
  else wx.showToast({ title: "\u5DF2\u6253\u5F00", icon: "none" });
}, data: { products: import_mock_data.products, visible: import_mock_data.products, active: "\u5168\u90E8", filters: ["\u5168\u90E8", "\u62A4\u80A4", "\u5E95\u5986", "\u773C\u5986", "\u5507\u5986", "\u5DE5\u5177", "\u4E34\u671F", "\u95F2\u7F6E", "\u7EA2\u699C", "\u9EC4\u699C", "\u9ED1\u699C"], query: "", detail: null }, filterList() {
  const { active, query } = this.data;
  const map = { \u7EA2\u699C: "red", \u9EC4\u699C: "yellow", \u9ED1\u699C: "black" };
  return this.data.products.filter((p) => (!query || `${p.brand}${p.product_name}${p.ingredients.join("")}`.includes(query)) && (active === "\u5168\u90E8" || active === "\u62A4\u80A4" && p.category === "skincare" || active === "\u5E95\u5986" && p.category === "base" || active === "\u773C\u5986" && p.category === "eye" || active === "\u5507\u5986" && p.category === "lip" || active === "\u5DE5\u5177" && p.category === "tool" || active === "\u4E34\u671F" && p.status === "expiring_soon" || active === "\u95F2\u7F6E" && p.status === "idle" || map[active] === p.list_status));
}, select(e) {
  this.setData({ active: e.currentTarget.dataset.v }, () => this.setData({ visible: this.filterList() }));
}, search(e) {
  this.setData({ query: e.detail.value }, () => this.setData({ visible: this.filterList() }));
}, onLoad(o) {
  if (o == null ? void 0 : o.query) this.setData({ query: o.query }, () => this.setData({ visible: this.filterList() }));
}, add() {
  wx.showActionSheet({ itemList: ["\u62CD\u7167 AI \u8BC6\u522B", "\u624B\u52A8\u641C\u7D22", "\u6279\u91CF\u5BFC\u5165"], success: (r) => {
    if (r.tapIndex === 0) wx.chooseMedia({ count: 1, mediaType: ["image"], success: (x) => {
      var _a, _b;
      return (0, import_product_service.recognizeProduct)({ path: (_b = (_a = x.tempFiles) == null ? void 0 : _a[0]) == null ? void 0 : _b.tempFilePath }).then((v) => {
        const next = [v.data, ...this.data.products];
        this.setData({ products: next, visible: next });
        (0, import_product_service.saveProducts)(next);
        wx.showToast({ title: "\u5DF2\u8BC6\u522B\u5E76\u6DFB\u52A0", icon: "success" });
      });
    } });
    else wx.showModal({ title: "\u624B\u52A8\u5F55\u5165", editable: true, placeholderText: "\u8F93\u5165\u4EA7\u54C1\u540D\u79F0", success: (x) => {
      if (x.confirm && x.content) {
        const p = { ...import_mock_data.products[0], id: `p${Date.now()}`, product_name: x.content };
        const next = [p, ...this.data.products];
        this.setData({ products: next, visible: next });
        (0, import_product_service.saveProducts)(next);
        wx.showToast({ title: "\u5DF2\u6DFB\u52A0", icon: "success" });
      }
    } });
  } });
}, open(e) {
  this.setData({ detail: e.currentTarget.dataset.item });
}, close() {
  this.setData({ detail: null });
}, compat() {
  (0, import_product_service.analyzeIngredients)(this.data.detail).then((v) => wx.showModal({ title: "\u642D\u914D\u68C0\u6D4B", content: v.data.summary, showCancel: false }));
}, addPlan() {
  wx.showToast({ title: "\u5DF2\u52A0\u5165\u4ECA\u65E5\u62A4\u7406\u8BA1\u5212", icon: "success" });
} });
