var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_mock_data = require("../../services/mock-data");
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
}, data: { products: import_mock_data.products, condition: "\u504F\u5E72 / \u6CDB\u7EA2\u98CE\u9669\u8F83\u9AD8", conditionDesc: "\u53D7\u79CB\u51AC\u5B63\u8282\u53CA\u5BA4\u5185\u5E72\u71E5\u5F71\u54CD\uFF0C\u5EFA\u8BAE\u7CBE\u7B80\u8865\u6C34\u4E0E\u6E29\u548C\u5C01\u5C42\u3002", tasks: [{ id: "t1", title: "\u4ECA\u65E5\u62A4\u7406", desc: "\u5DF2\u5B8C\u6210 1/3", image: "/assets/zip/skincare_routine_calm_1792080328109.jpg", url: "/pages/care/care", done: true }, { id: "t2", title: "\u4ECA\u65E5\u5986\u5BB9", desc: "\u5F85\u5F00\u59CB", image: "/assets/zip/makeup_studio_look_1792080328399.jpg", url: "/pages/makeup/makeup", done: false }, { id: "t3", title: "\u4E34\u671F\u63D0\u9192", desc: "\u6709 2 \u4EF6\u5373\u5C06\u8FC7\u671F", image: "/assets/zip/vanity_hero_showcase_1792080326105.jpg", url: "/pages/vanity/vanity", done: false }, { id: "t4", title: "\u6211\u7684\u5316\u5986\u53F0", desc: "\u5171\u6709 12 \u4EF6\u5355\u54C1", image: "/assets/zip/vanity_hero_showcase_1792080326105.jpg", url: "/pages/vanity/vanity", done: false }], toast: "" }, onShow() {
  const saved = wx.getStorageSync("home_tasks");
  if (saved) this.setData({ tasks: saved });
}, showToast(msg) {
  this.setData({ toast: msg });
  setTimeout(() => this.setData({ toast: "" }), 1800);
}, go(e) {
  wx.reLaunch({ url: e.currentTarget.dataset.url });
}, toggleTask(e) {
  const i = e.currentTarget.dataset.i;
  const tasks = this.data.tasks.map((x, n) => n === i ? { ...x, done: !x.done } : x);
  wx.setStorageSync("home_tasks", tasks);
  this.setData({ tasks });
  this.showToast(tasks[i].done ? "\u5DF2\u5B8C\u6210\u4ECA\u65E5\u4EFB\u52A1" : "\u5DF2\u53D6\u6D88\u4EFB\u52A1");
}, generate() {
  wx.showLoading({ title: "\u751F\u6210\u4E2D" });
  import("../../services/care-service").then((m) => m.generateCarePlan({ source: "home" })).then(() => {
    wx.hideLoading();
    wx.reLaunch({ url: "/pages/care/care" });
  }).catch(() => {
    wx.hideLoading();
    this.showToast("\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
  });
}, search() {
  wx.reLaunch({ url: "/pages/vanity/vanity?query=" });
}, notice() {
  wx.showModal({ title: "\u6D88\u606F\u63D0\u9192", content: "\u7406\u80A4\u6CC9 B5 \u4FEE\u590D\u971C\u8DDD\u79BB\u5F00\u5C01\u4FDD\u8D28\u671F\u4EC5\u5269 28 \u5929\uFF0C\u5EFA\u8BAE\u4F18\u5148\u4F7F\u7528\u3002" });
} });
