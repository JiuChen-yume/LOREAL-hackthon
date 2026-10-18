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
  circularRecords: () => circularRecords,
  feedback: () => feedback,
  looks: () => looks,
  mallItems: () => mallItems,
  products: () => products,
  routine: () => routine,
  steps: () => steps
});
module.exports = __toCommonJS(stdin_exports);
const A = "/assets/zip/";
const products = [
  { id: "p1", brand: "\u5DF4\u9ECE\u6B27\u83B1\u96C5", product_name: "\u7B2C\u4E8C\u4EE3\u9ED1\u7CBE\u534E\u808C\u5E95\u6DB2", category: "skincare", subcategory: "\u7CBE\u534E", size: "50ml", expiry_date: "2027-04-01", status: "in_use", list_status: "red", ingredients: ["\u4E8C\u88C2\u9175\u6BCD", "\u900F\u660E\u8D28\u9178"], usage_count: 68, image_url: A + "skincare_routine_calm_1792080328109.jpg", price: 369 },
  { id: "p2", brand: "\u7406\u80A4\u6CC9", product_name: "B5\u591A\u6548\u4FDD\u6E7F\u4FEE\u590D\u971C", category: "skincare", subcategory: "\u9762\u971C", size: "40ml", expiry_date: "2026-11-15", status: "expiring_soon", list_status: "red", ingredients: ["\u6CDB\u9187", "\u79EF\u96EA\u8349"], usage_count: 42, image_url: A + "vanity_hero_showcase_1792080326105.jpg", price: 135 },
  { id: "p3", brand: "\u5170\u853B", product_name: "\u83C1\u7EAF\u81FB\u989C\u7C89\u5E95\u6DB2 #100-PO", category: "base", subcategory: "\u7C89\u5E95\u6DB2", size: "35ml", expiry_date: "2027-06-25", status: "in_use", list_status: "red", ingredients: ["\u73BB\u8272\u56E0", "\u751F\u80B2\u915A"], usage_count: 53, image_url: A + "vanity_hero_showcase_1792080326105.jpg", price: 1100 },
  { id: "p4", brand: "3CE", product_name: "\u4E5D\u5BAB\u683C\u773C\u5F71\u76D8 OVERTAKE", category: "eye", subcategory: "\u773C\u5F71", size: "9\u8272", expiry_date: "2027-08-20", status: "idle", list_status: "none", ingredients: ["\u4E91\u6BCD", "\u6ED1\u77F3\u7C89"], usage_count: 22, image_url: A + "makeup_studio_look_1792080328399.jpg", price: 245 },
  { id: "p5", brand: "\u690D\u6751\u79C0", product_name: "\u65E0\u8272\u9650\u7EE2\u611F\u5507\u818F BR784", category: "lip", subcategory: "\u53E3\u7EA2", size: "3.3g", expiry_date: "2027-07-15", status: "in_use", list_status: "red", ingredients: ["\u5C71\u8336\u82B1\u7C7D\u6CB9"], usage_count: 48, image_url: A + "makeup_model_glamour_1792151327511.jpg", price: 330 },
  { id: "p6", brand: "\u73C2\u6DA6", product_name: "\u6DA6\u6D78\u4FDD\u6E7F\u6ECB\u517B\u4E73\u971C", category: "skincare", subcategory: "\u9762\u971C", size: "40g", expiry_date: "2027-05-15", status: "in_use", list_status: "red", ingredients: ["\u795E\u7ECF\u9170\u80FA", "\u5C3F\u56CA\u7D20"], usage_count: 59, image_url: A + "skincare_routine_calm_1792080328109.jpg", price: 188 }
];
const steps = [{ step_number: 1, category: "\u6D01\u9762", title: "\u6E29\u548C\u6D01\u9762", brand: "\u6021\u4E3D\u4E1D\u5C14", product_name: "\u51C0\u989C\u6D01\u9762\u4E73", dosage: "\u7EA61cm", wait_time: "30\u79D2", instruction: "\u6E29\u548C\u6E05\u6D01\uFF0C\u5E26\u8D70\u591A\u4F59\u6CB9\u8102\u3002" }, { step_number: 2, category: "\u723D\u80A4\u6C34", title: "\u8865\u6C34\u8212\u7F13", brand: "SK-II", product_name: "\u62A4\u80A4\u7CBE\u534E\u9732", dosage: "3-5\u6EF4", wait_time: "\u7B49\u5F8530\u79D2", instruction: "\u4E3A\u540E\u7EED\u5438\u6536\u6253\u597D\u57FA\u7840\u3002" }, { step_number: 3, category: "\u7CBE\u534E", title: "\u9000\u7EA2\u892A\u654F\u5F3A\u5316", brand: "\u96C5\u8BD7\u5170\u9EDB", product_name: "\u5C0F\u68D5\u74F6\u7CBE\u534E", dosage: "2-3\u6EF4", wait_time: "\u7B49\u5F8530\u79D2", instruction: "\u63D0\u5347\u808C\u80A4\u5149\u6CFD\uFF0C\u4FDD\u6301\u6C34\u6DA6\u3002" }, { step_number: 4, category: "\u4E73\u6DB2", title: "\u5C4F\u969C\u9501\u6C34", brand: "IPSA", product_name: "\u81EA\u5F8B\u5FAA\u73AF\u4E73\u6DB2", dosage: "2\u6CF5", wait_time: "\u8F7B\u62CD\u5438\u6536", instruction: "\u9501\u4F4F\u6C34\u5206\uFF0C\u67D4\u6DA6\u808C\u80A4\u3002" }, { step_number: 5, category: "\u9632\u6652", title: "\u65E5\u95F4\u9632\u62A4", brand: "ALLIE", product_name: "\u9632\u6652\u4E73", dosage: "\u7EA61-2cm", wait_time: "\u7B49\u5F85\u6210\u819C", instruction: "\u62B5\u5FA1\u65E5\u95F4\u73AF\u5883\uFF0C\u4FDD\u6301\u808C\u80A4\u72B6\u6001\u3002" }];
const routine = { id: "today", title: "\u4ECA\u65E5\u5C4F\u969C\u8212\u7F13\u4E0E\u6E05\u900F\u65E5\u5E38 Routine", time_budget: "5min", only_vanity: true, skin_status_summary: "\u4ECA\u65E5\u76AE\u80A4\u504F\u5E72\uFF0C\u5C40\u90E8\u6709\u5FAE\u5F31\u6CDB\u7EA2\u503E\u5411\u3002", morning_steps: steps, evening_steps: steps.slice(0, 2) };
const looks = [{ id: "l1", title: "\u6668\u66E6\u5FAE\u5149\u6C27\u6C14\u901A\u52E4\u5986", type: "daily", description: "\u900F\u6C14\u3001\u4F4E\u7C89\u611F\u7684\u5065\u5EB7\u4F2A\u7D20\u989C\u597D\u6C14\u8272\u3002", occasion: "\u65E5\u5E38\u901A\u52E4 / \u5468\u672B\u7EA6\u4F1A", image: A + "makeup_studio_look_1792080328399.jpg", steps: ["\u8584\u6D82\u7C89\u5E95", "\u6696\u6A58\u8272\u773C\u5F71\u6D88\u80BF", "\u53E3\u7EA2\u5507\u988A\u4E24\u7528"] }, { id: "l2", title: "\u6CD5\u5F0F\u590D\u53E4\u677E\u5F1B\u611F\u732B\u7CFB\u7EA2\u5507", type: "imitation", description: "\u67D4\u6DA6\u65E0\u7455\u5E95\u5986\u4E0E\u7ACB\u4F53\u7EA2\u5507\u3002", occasion: "\u665A\u5BB4 / \u827A\u672F\u5C55\u89C8", image: A + "makeup_model_glamour_1792151327511.jpg", steps: ["\u5E73\u6574\u9F3B\u7FFC\u808C\u7406", "\u62C9\u957F\u773C\u5C3E", "\u52FE\u52D2\u7EA2\u5507"] }, { id: "l3", title: "COS \u5986\u9020\uFF1A\u8D5B\u535A\u673A\u68B0\u59EC", type: "cos", description: "\u9002\u5E94\u821E\u53F0\u5F3A\u706F\u5149\u548C\u957F\u65F6\u95F4\u62CD\u6444\u3002", occasion: "\u6F2B\u5C55 / \u821E\u53F0", image: A + "home_beauty_portrait_1792151309450.jpg", steps: ["\u9AD8\u5149\u7ACB\u4F53\u6253\u4EAE", "\u6DF1\u8272\u7EBF\u6761\u52FE\u52D2", "\u5C40\u90E8\u5B9A\u5986"] }];
const mallItems = [{ id: "m1", brand: "\u5170\u853B", name: "\u8F7B\u8584\u6301\u5986\u7C89\u5E95\u6DB2", price: 219, reason: "\u9002\u5408\u6DF7\u5408\u808C\uFF0C\u81EA\u7136\u5986\u6548\uFF0C\u6301\u4E45\u670D\u5E16\u3002", image: A + "vanity_hero_showcase_1792080326105.jpg", similarity: 78 }, { id: "m2", brand: "\u690D\u6751\u79C0", name: "\u67D4\u96FE\u4E1D\u7ED2\u53E3\u7EA2", price: 168, reason: "\u663E\u8272\u6301\u4E45\uFF0C\u9002\u5408\u591A\u79CD\u80A4\u8272\u3002", image: A + "makeup_model_glamour_1792151327511.jpg", similarity: 86 }, { id: "m3", brand: "\u6625\u65E5\u9650\u5B9A", name: "\u56DB\u8272\u773C\u5F71\u76D8", price: 189, reason: "\u7EC6\u817B\u663E\u8272\uFF0C\u65B0\u624B\u53CB\u597D\u3002", image: A + "makeup_studio_look_1792080328399.jpg", commercial: true }];
const feedback = [{ id: "f1", product: "\u73C2\u6DA6 \u6DA6\u6D78\u4FDD\u6E7F\u5316\u5986\u6C34", feel: "\u8212\u670D", note: "\u4E0A\u8138\u5F88\u8212\u670D\uFF0C\u5438\u6536\u5FEB\uFF0C\u7B2C\u4E8C\u5929\u76AE\u80A4\u72B6\u6001\u7A33\u5B9A\u3002", image: A + "skincare_routine_calm_1792080328109.jpg" }, { id: "f2", product: "\u5B89\u8010\u6652 \u5C0F\u91D1\u74F6\u9632\u6652\u4E73", feel: "\u7D27\u7EF7", note: "\u521A\u4E0A\u8138\u6709\u70B9\u7D27\u7EF7\uFF0C\u534A\u5929\u540E\u611F\u89C9\u597D\u4E00\u4E9B\u3002", image: A + "vanity_hero_showcase_1792080326105.jpg" }, { id: "f3", product: "The Ordinary \u70DF\u9170\u80FA\u7CBE\u534E", feel: "\u6CDB\u7EA2", note: "\u4F7F\u7528\u540E\u8138\u988A\u6709\u4E9B\u6CDB\u7EA2\uFF0C\u6682\u65F6\u4E0D\u518D\u4F7F\u7528\u3002", image: A + "skincare_routine_calm_1792080328109.jpg" }];
const circularRecords = [{ id: "r1", date: "2026-10-12", item_name: "\u7A7A\u74F6\u56DE\u6536", points: 80, status: "\u5DF2\u6838\u9A8C" }];
