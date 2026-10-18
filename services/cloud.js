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
  callCloud: () => callCloud
});
module.exports = __toCommonJS(stdin_exports);
const id = () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const callCloud = async (name, data, fallback) => {
  var _a, _b, _c, _d;
  const requestId = id();
  try {
    if (!wx.cloud || !wx.cloud.callFunction) throw new Error("cloud unavailable");
    const r = await wx.cloud.callFunction({ name, data });
    return { success: true, data: (_c = (_b = (_a = r.result) == null ? void 0 : _a.data) != null ? _b : r.result) != null ? _c : fallback, message: ((_d = r.result) == null ? void 0 : _d.message) || "ok", requestId };
  } catch (e) {
    return { success: true, data: fallback, message: "\u5DF2\u4F7F\u7528\u79BB\u7EBF\u6F14\u793A\u6570\u636E", requestId, offline: true };
  }
};
