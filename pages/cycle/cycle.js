var import_mock_data = require("../../services/mock-data");
var import_cycle_service = require("../../services/cycle-service");
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
}, data: { records: import_mock_data.circularRecords, toast: "" }, onShow() {
  this.setData({ records: (0, import_cycle_service.listRecycleRecords)() });
}, open(e) {
  const t = e.currentTarget.dataset.t;
  if (t === "\u9884\u7EA6\u7A7A\u74F6\u56DE\u6536") {
    this.recycle();
    return;
  }
  wx.showModal({ title: t, content: t === "\u79EF\u5206\u5151\u6362" ? "\u5F53\u524D\u53EF\u7528\u79EF\u5206 340 \u5206\uFF0C\u53EF\u5151\u6362\u73AF\u4FDD\u793C\u9047\u3002" : t === "\u7A7A\u74F6\u56DE\u6536\u70B9" ? "\u5DF2\u627E\u5230 3 \u4E2A\u9644\u8FD1\u56DE\u6536\u70B9\u3002" : "\u793E\u533A\u5185\u5BB9\u5DF2\u51C6\u5907\u597D\u3002", showCancel: false });
}, community() {
  wx.showToast({ title: "\u793E\u533A\u5185\u5BB9\u5DF2\u6253\u5F00", icon: "none" });
}, recycle() {
  const next = (0, import_cycle_service.addRecycleRecord)();
  this.setData({ records: next });
  wx.showToast({ title: "\u56DE\u6536\u8BB0\u5F55\u5DF2\u6DFB\u52A0\uFF0C\u79EF\u5206 +80", icon: "success" });
} });
