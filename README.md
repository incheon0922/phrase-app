# 词汇积累小程序

一个基于 `Taro + React + TypeScript` 的微信小程序项目，用于本地词汇导入、日常练习、错题整理与学习统计。

当前版本偏个人作品和本地学习工具，不依赖后端、不接支付，数据默认保存在本地。

## 已实现功能

- 首页词汇学习面板
- 本地词汇导入
  - 支持 `TXT` 文件导入
  - 支持文本粘贴导入
- 四选一词汇练习
- 当日已练词条不重复抽取
- 错题本练习
  - 首页可直接进入
  - 答对后会从错题本中移除
- 学习统计
  - 当日练习题数
  - 正确率
  - 连续学习天数
  - 当前错题数
- 我的页面
  - 默认练习题数设置
  - 关于开发者弹窗
  - 清空练习记录/全部数据前确认弹窗

## 当前页面

- `pages/index/index`
  - 首页
- `pages/vocabulary-import/index`
  - 词汇导入
- `pages/practice/index`
  - 正常练习
- `pages/wrong-book/index`
  - 错题练习
- `pages/mine/index`
  - 我的

## 数据说明

项目当前使用本地存储，主要包括：

- 词汇数据
- 练习记录
- 错题本
- 学习统计
- 默认练习题数

练习记录已区分来源：

- `normal`
  - 正常练习
- `wrong_book`
  - 错题本练习

首页“当日练习题数”只统计当天的正常练习，不包含错题本练习。

## 运行方式

安装依赖：

```bash
npm install
```

启动微信小程序开发模式：

```bash
npm run dev:weapp
```

生产构建：

```bash
npm run build:weapp
```

然后在微信开发者工具中导入项目进行预览和调试。

## 项目结构

```txt
src/
  app.config.ts
  app.scss
  app.ts
  assets/
    tabbar/
  pages/
    index/
    vocabulary-import/
    practice/
    wrong-book/
    mine/
  types/
    study.ts
    vocabulary.ts
  utils/
    parser.ts
    stats.ts
    storage.ts
```

## 当前产品定位

- 个人作品
- 本地学习工具
- 无支付
- 无后端依赖

适合做：

- 个人词汇积累
- 日常刷题
- 错题复习
- 小程序作品集展示

## 后续可继续完善

- 错题列表页
- 收藏词汇
- 搜索词汇
- 更细的学习统计
- 隐私说明独立页面
- 小程序审核资料页
