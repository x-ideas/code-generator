import { GenerateClassFlowUnit } from '../lib/concreate-units/generate-class';

describe('测试 generate class', () => {
  test('一个interface', async () => {
    const str = `      /**
       * 进度
       */
      export interface IProgress {
          /**
           * 集货进度
           */
          collect_progress?: number;
          /**
           * 相对集货进度
           */
          collect_progress_relative?: number;
          /**
           * 校正集货数总和
           */
          collect_sum_correct?: number;
          /**
           * 待处理集货数总和
           */
          collect_sum_pending?: number;
          /**
           * 计划集货数总和
           */
          collect_sum_plan?: number;
          /**
           * 实际集货数总和
           */
          collect_sum_real?: number;
          /**
           * 出货进度
           */
          delivery_progress?: number;
          /**
           * 相对出货进度
           */
          delivery_progress_relative?: number;
          /**
           * 实际出货数总和
           */
          delivery_sum_real?: number;
          /**
           * 分货进度
           */
          distribute_progress?: number;
          /**
           * 相对分货进度
           */
          distribute_progress_relative?: number;
          /**
           * 实际分货数总和
           */
          distribute_sum_real?: number;
          /**
           * 波次创建进度
           */
          order_progress?: number;
          /**
           * 收货进度
           */
          receive_progress?: number;
          /**
           * 相对收货进度
           */
          receive_progress_relative?: number;
          /**
           * 实际入库数总和
           */
          receive_sum_real?: number;
      }`;

    const unit = new GenerateClassFlowUnit({ convertedFromNiceFormat: false });

    const result = await unit.doWork(str);

    expect(result).toMatchSnapshot();
  });
});
