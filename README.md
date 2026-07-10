# Toolbox

纯前端工具站，基于 `Vite 8 + React 19 + TypeScript 6`。

## 首版功能

- Base64 编解码，支持按行模式
- URL Encode / Decode
- Text / Hex 转换
- 定长随机字符串生成
- UUID 批量生成
- AES Key / IV Hex 生成
- AES-CBC / AES-GCM 加解密
- SHA-256 / 384 / 512
- JSON 格式化 / 压缩

为避免浏览器因一次性处理过多数据而卡顿，随机字符串最多生成 1,000,000 个字符，UUID 单次最多生成 10,000 个，二维码尺寸限制为 96–1024 px。

## 本地开发

本项目仅使用 `pnpm` 进行依赖管理。

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

## CI

GitHub Actions 工作流位于 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)，会在 `push` 和 `pull_request` 时执行安装与构建校验。
