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
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  analyzeIngredients: () => analyzeIngredients,
  listProducts: () => listProducts,
  recognizeProduct: () => recognizeProduct,
  saveProducts: () => saveProducts
});
module.exports = __toCommonJS(stdin_exports);
var import_mock_data = require("./mock-data");
var import_storage = require("./storage");
var import_cloud = require("./cloud");
const key = "vanity_products";
const listProducts = async () => (0, import_cloud.callCloud)("productService", { action: "list" }, (0, import_storage.readStore)(key, import_mock_data.products));
const saveProducts = async (items) => {
  (0, import_storage.writeStore)(key, items);
  return (0, import_cloud.callCloud)("productService", { action: "replace", items }, items);
};
const recognizeProduct = async (input) => (0, import_cloud.callCloud)("recognizeProduct", { input }, { ...import_mock_data.products[0], id: `p${Date.now()}`, product_name: "\u8BC6\u522B\u793A\u4F8B\u4EA7\u54C1" });
const analyzeIngredients = async (item) => (0, import_cloud.callCloud)("analyzeIngredients", { item }, { risk: "low", summary: "\u5F53\u524D\u7EC4\u5408\u6210\u5206\u91CD\u53E0\u8F83\u4F4E\uFF0C\u5EFA\u8BAE\u5148\u505A\u5C40\u90E8\u6D4B\u8BD5\u3002" });
