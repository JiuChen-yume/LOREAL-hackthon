# 云函数部署骨架

当前前端服务层通过 `wx.cloud.callFunction` 调用以下函数名：

- `getHomeSummary`
- `generateCarePlan`
- `productService`
- `recognizeProduct`
- `analyzeIngredients`
- `makeupService`
- `mallService`
- `cycleService`
- `profileService`

每个函数可先部署同一份基础处理器，再按 action 拆分数据库逻辑。前端已经具备离线 Mock 降级，因此云函数未部署时不会白屏。

部署前在微信开发者工具中绑定正式云环境，并将第三方 AI/OCR 密钥配置在云函数环境变量中。
