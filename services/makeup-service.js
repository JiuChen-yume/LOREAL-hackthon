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
  createMakeupTask: () => createMakeupTask,
  listLooks: () => listLooks,
  saveMakeupLook: () => saveMakeupLook
});
module.exports = __toCommonJS(stdin_exports);
var import_mock_data = require("./mock-data");
var import_storage = require("./storage");
var import_cloud = require("./cloud");
const listLooks = async () => (0, import_storage.readStore)("makeup_looks", import_mock_data.looks);
const createMakeupTask = async (input) => (0, import_cloud.callCloud)("makeupService", input, { status: "success", imageUrl: input.imageUrl || "/assets/zip/makeup_model_glamour_1792151327511.jpg", title: "AI \u5986\u5BB9\u7ED3\u679C" });
const saveMakeupLook = async (item) => {
  const list = (0, import_storage.readStore)("makeup_looks", import_mock_data.looks);
  const next = [item, ...list];
  (0, import_storage.writeStore)("makeup_looks", next);
  return next;
};
