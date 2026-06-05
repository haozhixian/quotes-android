# Quotes · 名言 — Android App

中英文双语名言集 Android APP。支持分页、搜索、重复检测、收藏、编辑、CSV 导出、8 种视觉特效。

## 下载 APK

**方法一：GitHub Actions（推荐，无需本地工具）**

1. 打开 https://github.com/new 注册/登录 GitHub
2. 点 **Create repository**，仓库名填 `quotes-android`
3. 在仓库页点 **Upload an existing file**，把 `quotes_android` 文件夹**里面所有文件**拖进去上传
4. 点仓库顶部的 **Actions** 标签 → **Build APK** → **Run workflow**
5. 等待几分钟，Actions 跑完后点进去 → **Artifacts** → 下载 `quotes-app-debug.zip`
6. 解压得到 `.apk` 文件，传到手机安装即可

**方法二：安装 Android Studio（适合后续修改）**

1. 下载 https://developer.android.com/studio
2. 安装后点 **Open** → 选择 `quotes_android` 文件夹
3. 连手机或点 **Build → Build APK(s)**

## 测试

APK 装好后，打开即可看到 100 条预置名言，所有功能离线可用。

## 功能

- 分页浏览（每页 20 条）
- 关键词搜索（英文 + 中文）
- 相似/重复检测（跨页跳转 + 高亮）
- 收藏 / 取消收藏
- 行内编辑 / 删除
- CSV 导出
- 8 种视觉特效（星光、流星、萤火虫、极光、花瓣、矩阵雨、散景、全开）
- 随机跳转
