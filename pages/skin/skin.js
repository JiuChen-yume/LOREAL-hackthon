var import_storage = require("../../services/storage");
var import_skin_service = require("../../services/skin-service");
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
}, data: { tabs: ["\u7EA2\u699C", "\u9EC4\u699C", "\u9ED1\u699C", "\u6210\u5206\u907F\u96F7\u5E93", "\u4F7F\u7528\u53CD\u9988"], active: "\u7EA2\u699C", feedback: (0, import_skin_service.listFeedback)(), filterBlack: (0, import_storage.readStore)("filter_black", true), profile: { name: "Luna", skin: "\u504F\u5E72\u654F\u611F\u808C" }, highContrast: false }, select(e) {
  this.setData({ active: e.currentTarget.dataset.v });
}, toggle(e) {
  this.setData({ filterBlack: e.detail.value });
  (0, import_storage.writeStore)("filter_black", e.detail.value);
}, cycle() {
  wx.showActionSheet({ itemList: ["\u7ECF\u671F", "\u5375\u6CE1\u671F", "\u6392\u5375\u671F", "\u9EC4\u4F53\u671F"], success: (r) => wx.showToast({ title: `\u5DF2\u8BBE\u7F6E${r.tapIndex === 0 ? "\u7ECF\u671F" : r.tapIndex === 1 ? "\u5375\u6CE1\u671F" : r.tapIndex === 2 ? "\u6392\u5375\u671F" : "\u9EC4\u4F53\u671F"}`, icon: "success" }) });
}, privacy() {
  wx.showModal({ title: "\u9690\u79C1\u4E0E\u533B\u7597\u514D\u8D23\u58F0\u660E", content: "\u4F60\u7684\u4EA7\u54C1\u3001\u80A4\u8D28\u548C\u53CD\u9988\u6570\u636E\u53EA\u4FDD\u5B58\u5728\u672C\u5730\u3002AI \u5EFA\u8BAE\u5C5E\u4E8E\u65E5\u5E38\u7F8E\u5BB9\u62A4\u7406\u63D0\u793A\uFF0C\u4E0D\u6784\u6210\u533B\u7597\u8BCA\u65AD\u3002", showCancel: false });
}, addFeedback() {
  const next = (0, import_skin_service.saveFeedback)({ product: "\u4ECA\u65E5\u62A4\u80A4\u8BB0\u5F55", feel: "\u8212\u670D", note: "\u4ECA\u5929\u7684\u62A4\u7406\u6D41\u7A0B\u5B8C\u6210\u987A\u5229\u3002", image: "/assets/zip/skincare_routine_calm_1792080328109.jpg" });
  this.setData({ feedback: next });
  wx.showToast({ title: "\u53CD\u9988\u5DF2\u4FDD\u5B58", icon: "success" });
}, exportData() {
  const path = `${wx.env.USER_DATA_PATH}/vanity-backup.json`;
  const fs = wx.getFileSystemManager();
  fs.writeFile({ filePath: path, data: JSON.stringify(this.data), encoding: "utf8", success: () => wx.showToast({ title: "\u6570\u636E\u5907\u4EFD\u5DF2\u751F\u6210", icon: "success" }) });
}, clear() {
  wx.showModal({ title: "\u6E05\u7A7A\u672C\u5730\u6570\u636E", content: "\u5C06\u6E05\u9664\u5316\u5986\u53F0\u3001\u53CD\u9988\u548C\u62A4\u7406\u8BB0\u5F55\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F", success: (r) => {
    if (r.confirm) {
      wx.clearStorageSync();
      this.setData({ feedback: (0, import_skin_service.listFeedback)() });
      wx.showToast({ title: "\u5DF2\u6E05\u7A7A", icon: "success" });
    }
  } });
} });
