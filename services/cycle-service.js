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
  addRecycleRecord: () => addRecycleRecord,
  listRecycleRecords: () => listRecycleRecords
});
module.exports = __toCommonJS(stdin_exports);
var import_mock_data = require("./mock-data");
var import_storage = require("./storage");
const listRecycleRecords = () => (0, import_storage.readStore)("recycle_records", import_mock_data.circularRecords);
const addRecycleRecord = () => {
  const list = listRecycleRecords();
  const next = [{ id: `r${Date.now()}`, date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), item_name: "\u7A7A\u74F6\u56DE\u6536", points: 80, status: "\u5F85\u6838\u9A8C" }, ...list];
  (0, import_storage.writeStore)("recycle_records", next);
  return next;
};
