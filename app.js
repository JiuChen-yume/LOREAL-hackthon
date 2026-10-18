App({ globalData: { user: { name: "Luna", skinType: "\u504F\u5E72" }, selectedProducts: [] }, onLaunch() {
  try {
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
    }
  } catch (e) {
  }
} });
