export class CBasicModel {
  #parsedErrorTips: string[] = [];

  /**
   * 解析过程是否成功
   * @returns {boolean}
   * @memberof CBasicModel
   */
  isParsedCorrect(): boolean {
    // 暂时未提供，方案待确定
    return true;
    // return this.#parsedErrorTips.length === 0;
  }

  /**
   * 新增解析过程的错误提示
   * @param {string} tip
   * @memberof CBasicModel
   */
  addParsedErrorTip(tip: string): void {
    this.#parsedErrorTips.push(tip);
  }
}
