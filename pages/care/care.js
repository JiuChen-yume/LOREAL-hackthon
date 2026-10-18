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
}, data: { routine: import_mock_data.routine, steps: import_mock_data.steps, tabs: ["\u65E5\u5E38 Routine", "\u7279\u6B8A\u573A\u666F", "\u62A4\u80A4\u6253\u5361", "\u5468\u671F\u590D\u76D8"], active: "\u65E5\u5E38 Routine", time: "5\u5206\u949F", onlyVanity: true, loading: false }, select(e) {
  this.setData({ active: e.currentTarget.dataset.v });
}, chooseTime(e) {
  this.setData({ time: e.currentTarget.dataset.v });
}, toggle(e) {
  this.setData({ onlyVanity: e.detail.value });
}, generate() {
  this.setData({ loading: true });
  import("../../services/care-service").then((m) => m.generateCarePlan({ time: this.data.time, onlyVanity: this.data.onlyVanity })).then(() => {
    this.setData({ loading: false });
    wx.showToast({ title: "\u62A4\u7406\u8BA1\u5212\u5DF2\u66F4\u65B0", icon: "success" });
  }).catch(() => {
    this.setData({ loading: false });
    wx.showToast({ title: "\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", icon: "none" });
  });
}, check() {
  import("../../services/care-service").then((m) => m.saveCareCheckin({ feel: "\u8212\u670D", plan: "today" })).then(() => wx.showToast({ title: "\u5DF2\u5B8C\u6210\u4ECA\u65E5\u6253\u5361", icon: "success" }));
} });
