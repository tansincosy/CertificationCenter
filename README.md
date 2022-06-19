# 杂货屋 权限模块

杂货屋的权限模块，采用 oauth2 验证流程，使用 mysql 作为数据，redis 作为缓存;
数据库连接采用使用是 [prisma](https://www.prisma.io/);

[![AGPL License](https://img.shields.io/badge/license-Apache%202-blue)](http://www.gnu.org/licenses/agpl-3.0)

## 安装

请先安装最新版本 npm

```bash
$ npm install

```

## 运行

```bash
# 初始化数据库
$ npx prisma db push
# 开发模式
$ npm run start:dev
# 编译样式
$ npm run style
```

## 打包

```bash
# 简单打包 /dist 文件夹下
$ npm run build

# 打包为单个.js 文件，/build文件下
# 由于采用的prisma 作为数据库，需要注意打包环境，区分不同环境
$ npm run build:bundle
```

## 测试

运行 e2e 测试

```bash
$ npm run test:e2e
```

## FAQ

#### 如何初始化数据库

```bash
$ npx prisma db push
```

## 作者

- [@tansincosy](https://github.com/tansincosy)
