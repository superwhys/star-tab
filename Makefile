SHELL := /bin/sh

DIST_DIR := dist
PACKAGE_NAME := StarTab.zip

.PHONY: all build package clean-package

all: package

build:
	npm run build

package: build
	@test -f "$(DIST_DIR)/manifest.json" || { echo "错误：$(DIST_DIR)/manifest.json 不存在，无法打包 Chrome 插件。"; exit 1; }
	@rm -f "$(PACKAGE_NAME)"
	@cd "$(DIST_DIR)" && zip -r -q "../$(PACKAGE_NAME)" . -x "*.DS_Store" "__MACOSX/*"
	@echo "打包完成：$(PACKAGE_NAME)"

clean-package:
	@rm -f "$(PACKAGE_NAME)"
	@echo "已删除：$(PACKAGE_NAME)"
