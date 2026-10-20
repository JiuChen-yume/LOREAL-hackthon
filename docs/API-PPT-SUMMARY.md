# Beauty Twin API 简版（商赛 PPT）

## 一句话介绍

Beauty Twin 通过统一的 `/api` 接口，把用户图片、产品信息和肤质需求交给 AI 服务，返回护理建议、妆容方案和产品管理结果。

## API 总览

| 模块 | 接口示例 | 作用 | 返回结果 |
|---|---|---|---|
| 产品识别 | `POST /api/ocr/recognize` | 上传化妆品包装图 | 品牌、产品名、规格、成分 |
| 商品识别 | `POST /api/product/recognize` | 一张图识别多个产品 | 产品列表、位置、置信度 |
| 护理计划 | `POST /api/home/generate-plan` | 根据肤况和时间生成方案 | 早间/晚间护理步骤 |
| 成分检测 | `POST /api/compatibility/check` | 检查产品能否一起使用 | 安全等级、冲突成分、使用顺序 |
| AI 妆容 | `POST /api/makeup/generate` | 根据风格生成妆容 | 妆容说明、产品匹配、化妆步骤 |
| 妆教解析 | `POST /api/makeup/parse-tutorial` | 把妆教内容转成步骤 | 可执行的分步教程 |
| 产品管理 | `GET/POST /api/products` | 管理用户化妆台 | 产品列表和新增结果 |
| 回收积分 | `GET/POST /api/recycling` | 记录空瓶回收行为 | 回收记录、积分 |

## 最典型的一次调用

```text
用户上传产品照片
        ↓
POST /api/ocr/recognize
        ↓
识别品牌、产品和成分
        ↓
POST /api/compatibility/check
        ↓
返回安全等级与搭配建议
```

## 统一调用格式

- **地址**：`/api/...`
- **方法**：GET 查询，POST 提交或生成，PUT 更新，DELETE 删除
- **数据格式**：JSON
- **图片格式**：Base64 图片
- **成功**：`success: true`
- **失败**：`success: false` + `error`

示例：

```json
POST /api/home/generate-plan
{
  "timeBudget": "5min",
  "skinCondition": "偏干、局部泛红",
  "vanityProducts": []
}
```

```json
{
  "success": true,
  "plan": {
    "morning_steps": [],
    "evening_steps": []
  }
}
```

## 使用到的第三方 API

| 服务 | 在项目中的作用 |
|---|---|
| 腾讯云 OCR / 商品识别 | 识别包装文字、二维码和多个商品 |
| 豆包 / 火山方舟 | 图片理解、商品识别和结构化信息提取 |
| Google Gemini / DeepSeek | 生成护理计划、成分分析和妆容方案 |
| 豆包 Seedream | 生成头像和妆效图片 |
| Cloudflare D1 / R2 | 保存产品数据和图片 |
| 腾讯 WebAR | 静态图片试妆 |

## 技术亮点

1. **一个 API 层接入多个 AI 能力**：前端不需要分别对接不同厂商。
2. **自动降级**：主服务不可用时切换到备用 AI 或演示数据，保证流程可展示。
3. **服务端保管密钥**：第三方 API Key 不暴露给前端。
4. **可扩展**：产品、护理、妆容、回收等模块使用统一 JSON 接口，便于后续接入真实数据库和小程序。
