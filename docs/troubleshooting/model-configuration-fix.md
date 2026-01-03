# 模型配置修正指南

## 問題：Claude Opus 4.5 模型名稱錯誤

### 錯誤訊息

```
Error handling model response
Model/deployment not found for: claude-opus-4-5-20241120
{"type":"not_found_error","message":"model: claude-opus-4-5-20241120"}
```

### 原因

配置檔案中使用了不存在的模型名稱 `claude-opus-4-5-20241120`。

### 解決方案

#### 步驟 1: 打開配置檔案

```bash
code ~/.continue/config.yaml
```

#### 步驟 2: 修正模型名稱

找到以下內容：

```yaml
- name: Claude 4.5 Opus
  provider: anthropic
  model: claude-opus-4-5-20241120 # ❌ 錯誤的名稱
```

改為以下其中一個正確的名稱：

**選項 1: 使用簡短名稱（推薦）**

```yaml
- name: Claude 4.5 Opus
  provider: anthropic
  model: claude-opus-4-5 # ✅ 正確
```

**選項 2: 使用 Claude 4.1 Opus（目前最新的 Opus 版本）**

```yaml
- name: Claude Opus 4.1
  provider: anthropic
  model: claude-opus-4-1-20250805 # ✅ 正確
```

#### 步驟 3: 儲存並重新載入

1. 儲存配置檔案（Cmd+S 或 Ctrl+S）
2. 在 Continue 擴充功能中點擊「Reload」按鈕
3. 或重新啟動 VSCode

### 完整的正確配置範例

```yaml
name: My Config
version: 1.0.0
schema: v1

models:
  # Claude 4.5 Sonnet - 適合一般對話和程式碼生成
  - name: Claude 4.5 Sonnet
    provider: anthropic
    model: claude-sonnet-4-5-20241022
    apiKey: YOUR_API_KEY_HERE
    roles:
      - chat
      - edit
      - apply

  # Claude 4.5 Opus - 最強大的模型，適合複雜任務
  - name: Claude 4.5 Opus
    provider: anthropic
    model: claude-opus-4-5 # ✅ 使用簡短名稱
    apiKey: YOUR_API_KEY_HERE
    roles:
      - chat
      - edit
      - apply

  # Claude 4.5 Haiku - 最快速，適合 autocomplete
  - name: Claude 4.5 Haiku
    provider: anthropic
    model: claude-haiku-4-5-20241022
    apiKey: YOUR_API_KEY_HERE
    roles:
      - autocomplete
```

## Anthropic 官方模型名稱參考

### Claude 4.5 系列

- `claude-sonnet-4-5-20241022` - Claude 4.5 Sonnet（最新版本）
- `claude-haiku-4-5-20241022` - Claude 4.5 Haiku（最新版本）
- `claude-opus-4-5` - Claude 4.5 Opus（簡短名稱）

### Claude 4.1 系列

- `claude-opus-4-1-20250805` - Claude Opus 4.1（目前最新的 Opus 版本）

### Claude 4 系列

- `claude-sonnet-4-20250514` - Claude Sonnet 4
- `claude-4-sonnet-latest` - Claude 4 Sonnet（最新版本）

### 舊版本（不推薦）

- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet
- `claude-3-5-haiku-20241022` - Claude 3.5 Haiku
- `claude-3-opus-20240229` - Claude 3 Opus

## 相關問題

### 如何查看可用的模型？

1. 訪問 [Anthropic API 文件](https://docs.anthropic.com/en/docs/about-claude/models)
2. 或在 Continue 擴充功能中查看「Add New Model」頁面

### 如何切換模型？

1. 在 Continue 聊天介面中點擊模型選擇器
2. 選擇你想使用的模型
3. 或在配置檔案中調整 `roles` 設定

### API Key 在哪裡取得？

1. 訪問 [Anthropic Console](https://console.anthropic.com/)
2. 登入你的帳號
3. 前往「API Keys」頁面
4. 建立新的 API Key

## 注意事項

⚠️ **安全提醒**

- 不要將 API Key 提交到 Git 儲存庫
- 不要在公開場合分享你的 API Key
- 定期輪換你的 API Key

⚠️ **成本提醒**

- Claude Opus 是最昂貴的模型
- 建議日常使用 Sonnet，複雜任務才使用 Opus
- 使用 Haiku 進行 autocomplete 以節省成本

## 更多資源

- [Anthropic 官方文件](https://docs.anthropic.com/)
- [Continue 官方文件](https://docs.continue.dev/)
- [模型定價](https://www.anthropic.com/pricing)
