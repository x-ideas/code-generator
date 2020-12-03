#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
// pupu-service-generate --swaggerDoc=  --code=  --output=  --typeName=  --toClass=
const program = new commander_1.Command();
program.version('1.0.0');
program.option('-o, --output <file>', '输出文件', './generate-service.ts');
program.option('-s, --site <url>', 'swagger文档的地址');
program.option('-c, --code <code>', '请求的code');
program.option('-t, --type-name <type>', '生成的类型的名字', 'GeneratedInfo');
program.option('--enable-adaptor <adapt>', '是否对类型进行适配', true);
program.option('--adpat-type ["interface" | "class"]', '适配器的类型', 'class');
program.parse(process.argv);
console.log('接受的参数为', program.opts());
