var import_mock_data = require("../../services/mock-data");
var import_makeup_service = require("../../services/makeup-service");
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
}, data: { looks: import_mock_data.looks, toast: "", generating: false, result: null }, open() {
  wx.showActionSheet({ itemList: ["\u751F\u6210\u4ECA\u65E5\u5986\u5BB9", "\u4E0A\u4F20\u56FE\u7247\u4EFF\u5986", "COS \u5986\u9020"], success: (r) => {
    this.setData({ generating: true });
    (0, import_makeup_service.createMakeupTask)({ type: r.tapIndex }).then((v) => {
      const item = { ...import_mock_data.looks[0], id: `l${Date.now()}`, title: v.data.title, image: v.data.imageUrl };
      this.setData({ generating: false, result: item, looks: [item, ...this.data.looks] });
      (0, import_makeup_service.saveMakeupLook)(item);
      wx.showToast({ title: "\u5986\u5BB9\u751F\u6210\u5B8C\u6210", icon: "success" });
    });
  } });
}, replay(e) {
  wx.showToast({ title: "\u5DF2\u52A0\u8F7D" + e.currentTarget.dataset.name, icon: "success" });
}, chooseImage() {
  wx.chooseMedia({ count: 1, mediaType: ["image"], success: (x) => {
    var _a, _b;
    this.setData({ generating: true });
    (0, import_makeup_service.createMakeupTask)({ type: "imitation", imageUrl: (_b = (_a = x.tempFiles) == null ? void 0 : _a[0]) == null ? void 0 : _b.tempFilePath }).then((v) => {
      this.setData({ generating: false, result: v.data });
      wx.showToast({ title: "\u53C2\u8003\u56FE\u4EFF\u5986\u5B8C\u6210", icon: "success" });
    });
  } });
} });
