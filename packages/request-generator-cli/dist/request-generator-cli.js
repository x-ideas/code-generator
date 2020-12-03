#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
// pupu-service-generate --swaggerDoc=  --code=  --output=  --typeName=  --toClass=
const program = new commander_1.Command();
program.version('1.0.0');
program.option('-o, --output', '输出文件', './generate-service.ts');
program.option('-s, --site', 'swagger文档的地址');
program.option('-c, --code', '请求的code');
program.option('-t, --typeName', '生成的类型的名字', 'GeneratedInfo');
program.option('--class', '是否生成class', false);
program.parse(process.argv);
