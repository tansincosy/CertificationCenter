#! /bin/bash

cat <<EOF
编译脚本
EOF

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $*"
}

pre_build() {
    if [ -d './build' ]; then
        log "删除旧的build文件夹"
        rm -rf ./build
    fi
    if [ -e 'bundle.tar.gz' ]; then
        log "删除旧的bundle.tar.gz文件"
        rm -rf ./bundle.tar.gz
    fi
}

build_base_pack() {
    log "构建nestAPP 基本打包模块"
    npm run build
}

build_bundle_pack() {
    # 判断在操作系统
    log "通过ncc将多个文件合并为一个node-js文件"
    npm run build:bundle
}

cp_assets_to_bunlde() {
    if [ "$?XXX" = "0XXX" ]; then
        log "复制静态资源到到打包资源中"
        mkdir -p ./build/public/
        cp -r ./dist/src/views ./build/views/
        cp -r ./dist/src/public/index.css ./build/public/
    fi
}

mv_prisma_node_up_dir() {
    log "移动prisma中node兼容模块"
    mv ./build/client/*.node ./build
    rm -rf ./build/client
}

tar_bundle_pack() {
    log "将其压缩到一个文件中"
    # 从package.json中获取版本号
    version=$(node -e "console.log(require('./package.json').version)")
    # 从package.json中获取名字
    name=$(node -e "console.log(require('./package.json').name)")
    # 删除package.json文件
    rm -rf ./build/package.json
    # 压缩文件名
    bundle_name="${name}.${version}.tar.gz"
    tar -zcvf "${bundle_name}" ./build/*
}

build_log() {
    echo "
    version: 1.0.0
    date: $(date '+%Y-%m-%d %H:%M:%S')
   " >>./build/build.log
    cp package.json ./build/package.json
}

pre_build
build_base_pack
build_bundle_pack
mv_prisma_node_up_dir
cp_assets_to_bunlde
build_log
tar_bundle_pack
