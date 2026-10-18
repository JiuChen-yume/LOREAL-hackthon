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
  generateCarePlan: () => generateCarePlan,
  listCareCheckins: () => listCareCheckins,
  saveCareCheckin: () => saveCareCheckin
});
module.exports = __toCommonJS(stdin_exports);
var import_mock_data = require("./mock-data");
var import_storage = require("./storage");
var import_cloud = require("./cloud");
const generateCarePlan = async (input) => (0, import_cloud.callCloud)("generateCarePlan", input, import_mock_data.routine);
const saveCareCheckin = async (item) => {
  const list = (0, import_storage.readStore)("care_checkins", []);
  list.unshift({ ...item, id: `c${Date.now()}` });
  (0, import_storage.writeStore)("care_checkins", list);
  return (0, import_cloud.callCloud)("careCheckins", { item }, list);
};
const listCareCheckins = async () => (0, import_storage.readStore)("care_checkins", []);
