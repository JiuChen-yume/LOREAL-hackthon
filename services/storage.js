var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  readStore: () => readStore,
  removeStore: () => removeStore,
  writeStore: () => writeStore
});
module.exports = __toCommonJS(stdin_exports);
const readStore = (key, fallback) => {
  try {
    const v = wx.getStorageSync(key);
    return v === void 0 || v === null || v === "" ? fallback : v;
  } catch (e) {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {
  }
};
const removeStore = (key) => {
  try {
    wx.removeStorageSync(key);
  } catch (e) {
  }
};
