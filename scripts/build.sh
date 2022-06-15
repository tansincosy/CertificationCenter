#! /bin/bash

cat <<EOF
编译脚本
EOF

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $*"
}

build_base_pack() {
    log "构建nestAPP 基本打包模块"
    npm run build
}

build_bundle_pack() {
    if [ -d './build' ]; then
        log "删除旧的build文件夹"
        rm -rf ./build
    fi
    log "通过ncc将多个文件合并为一个node-js文件"
    npm run build:bundle
}

cp_assets_to_bunlde() {
    if [ "$?XXX" = "0XXX" ]; then
        log "复制静态资源到到打包资源中"
        mkdir -p ./build/public/
        cp -r ./dist/views ./build/views/
        cp -r ./dist/public/index.css ./build/public/
    fi
}

mv_prisma_node_up_dir() {
    log "移动prisma中node兼容模块"
    mv ./build/client/*.node ./build
    rm -rf ./build/client
}

tar_bundle_pack() {
    log "将其压缩到一个文件中"
    tar -zcvf bundle.tar.gz ./build/*
}

build_log() {
    echo "
    version: 1.0.0
    date: $(date '+%Y-%m-%d %H:%M:%S')
   " >>./build/build.log
}

build_base_pack
build_bundle_pack
mv_prisma_node_up_dir
cp_assets_to_bunlde
build_log
tar_bundle_pack
