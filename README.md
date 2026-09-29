# Toolbox

基于 Vite、React 和 TypeScript 的纯前端工具站。工具数据在浏览器本地处理，不上传服务器。

## 功能

- Base64 编解码（UTF-8、按行模式）、URL Component 编解码、Text / Hex 转换
- 随机字符串、UUID v4 批量生成
- 二维码预览、复制 SVG、下载 PNG / JPEG / WebP
- 图片压缩与格式转换（PNG / JPEG / WebP）
- AES-CBC / AES-GCM 加解密及 Key / IV 生成
- RSA / ECC 密钥对与 CSR 生成
- SHA-256 / SHA-384 / SHA-512 摘要
- Unix 时间戳转本地时间，支持秒、毫秒、微秒、纳秒
- JWT Header / Payload 解码与时间声明检查
- JSON 格式化 / 压缩，保留数字、字符串转义和重复键的原文

分类与搜索仅隐藏工具，保留当前输入和结果。点击“清空所有工具”或刷新页面可清除会话数据；密钥等内容不会写入本地存储。

JWT 仅解码，**不验证签名**；“未过期”不代表可信或可用于认证，时间状态以点击解析时为准。时间戳自动识别按位数推测，历史时间或带前导零的输入建议手动选择单位。

图片下载使用生成结果的文件名与实际格式。修改选项后需重新处理；动画图片会变成静态图，JPEG 输出使用白色背景，重新编码可能增大文件。

## 开发环境

使用 nvm 管理 Node.js，项目版本由 `.nvmrc` 指定为 Node 22，最低要求 22.13。仅使用 pnpm 管理项目依赖，版本锁定在 `package.json`。

```bash
nvm install
nvm use
npm install -g pnpm@11.8.0
pnpm install --frozen-lockfile
pnpm dev
```

非交互脚本应显式加载 nvm，例如：

```bash
. "$HOME/.nvm/nvm.sh"
nvm use
pnpm build
```

## 检查与构建

```bash
pnpm lint
pnpm test
pnpm build
pnpm preview
```

测试包含编码与加密函数、CSR 签名验证、JSON 数值保真、JWT 非法时间字段，以及筛选状态保留、剪贴板错误、图片下载元数据、异步任务竞争和资源释放等组件回归测试。组件测试使用 jsdom；真实浏览器对图片解码、Canvas 编码和下载的支持仍取决于浏览器。

[GitHub Actions](.github/workflows/deploy.yml) 在 main 分支推送和 PR 时执行冻结锁文件安装、lint、测试及构建。CI 与本地共用 `.nvmrc`。

## 输入与资源限制

- 通用文本输入最多 1,000,000 个 UTF-16 字符单位；超限报错，不静默截断。
- JSON 最多嵌套 100 层，格式化输出最多 4,000,000 个字符单位。
- 随机字符串每条最多 10,000 个 Unicode 码点、最多 1,000 条，总计最多 1,000,000 个码点；UUID 单次最多 10,000 个。
- 二维码内容最多 1,000 个 UTF-8 字节，支持全部纠错等级；尺寸为 96–1024 px。
- 图片文件最多 20 MiB，最多 2400 万像素，单边最多 8192 px。文件大小在解码前检查，像素限制在解码后、创建 Canvas 前检查；浏览器解码本身仍会消耗内存。
- 时间戳输入最多 64 个字符，微秒与纳秒换算使用 BigInt 保留精度。

## 代码结构

- `src/App.tsx`：导航、筛选、会话重置与复制反馈
- `src/catalog.ts`：工具目录与分类
- `src/tools/`：各工具 UI，图片工具共用 `ImageTool`
- `src/components/`：卡片、文本输入、预览及错误边界
- `src/hooks/`：异步任务失效控制、Blob URL 生命周期
- `src/lib/`：数据转换、密码学、图片处理与输入校验

CSR 依赖与其元数据支持库仅在生成 CSR 时动态加载。异步任务只允许当前请求写回结果；参数或文件变化后，旧结果被忽略，图片位图和 Blob URL 按生命周期释放。
