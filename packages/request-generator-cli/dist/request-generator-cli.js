#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
commander_1.default
    .command('module')
    .alias('m')
    .description('创建新的模块')
    // .option('-a, --name [moduleName]', '模块名称')
    .action(option => {
    console.log('Hello World');
    //为什么是Hello World 给你个眼神，自己去体会...
});
commander_1.default.parse(process.argv);
