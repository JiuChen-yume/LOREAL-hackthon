var import_mock_data = require("../../services/mock-data");
var import_mall_service = require("../../services/mall-service");
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
}, data: { items: import_mock_data.mallItems, tabs: ["\u4E3A\u4F60\u8865\u9F50", "\u5316\u5986\u53F0\u5E73\u66FF", "\u4E34\u8FD1\u7528\u5B8C", "\u65B0\u54C1\u63A2\u7D22", "\u7EBF\u4E0B\u4E13\u67DC", "\u4EA7\u54C1\u56DE\u6536"], active: "\u4E3A\u4F60\u8865\u9F50", shopping: [] }, onShow() {
  this.setData({ shopping: (0, import_mall_service.listShopping)() });
}, select(e) {
  this.setData({ active: e.currentTarget.dataset.v });
}, buy(e) {
  var _a, _b;
  const item = (_b = (_a = e == null ? void 0 : e.currentTarget) == null ? void 0 : _a.dataset) == null ? void 0 : _b.item;
  if (item) {
    const next = (0, import_mall_service.toggleShopping)(item);
    this.setData({ shopping: next });
    wx.showToast({ title: next.some((x) => x.id === item.id) ? "\u5DF2\u52A0\u5165\u8D2D\u7269\u6E05\u5355" : "\u5DF2\u79FB\u51FA\u8D2D\u7269\u6E05\u5355", icon: "success" });
    return;
  }
  wx.showModal({ title: "\u7406\u6027\u9009\u8D2D\u63D0\u9192", content: "\u4F60\u7684\u5316\u5986\u53F0\u91CC\u5DF2\u6709\u76F8\u4F3C\u4EA7\u54C1\uFF0C\u5EFA\u8BAE\u5148\u67E5\u770B\u73B0\u6709\u4EA7\u54C1\u7684\u4F7F\u7528\u65B9\u6848\u3002", confirmText: "\u67E5\u770B\u5316\u5986\u53F0", success: (r) => {
    if (r.confirm) wx.reLaunch({ url: "/pages/vanity/vanity" });
  } });
} });
