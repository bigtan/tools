# Toolbox

纯前端工具站，基于 `Vite 7 + React 19 + TypeScript 5`。

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
