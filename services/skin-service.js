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
  listFeedback: () => listFeedback,
  saveFeedback: () => saveFeedback
});
module.exports = __toCommonJS(stdin_exports);
var import_mock_data = require("./mock-data");
var import_storage = require("./storage");
const listFeedback = () => (0, import_storage.readStore)("skin_feedback", import_mock_data.feedback);
const saveFeedback = (item) => {
  const next = [{ ...item, id: `f${Date.now()}` }, ...listFeedback()];
  (0, import_storage.writeStore)("skin_feedback", next);
  return next;
};
