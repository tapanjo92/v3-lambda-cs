import { withColdStartLog } from '../src';

describe('withColdStartLog', () => {
  it('logs report on first invocation', async () => {
    const logger = jest.fn();
    const handler = jest.fn().mockResolvedValue('ok');
    const wrapped = withColdStartLog(handler, { tenantId: 't1', logger });

    const result = await wrapped({});

    expect(result).toBe('ok');
    expect(logger).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logger.mock.calls[0][0]);
    expect(parsed).toEqual(expect.objectContaining({
      type: 'ColdStartReport',
      tenantId: 't1'
    }));

    await wrapped({});
    expect(logger).toHaveBeenCalledTimes(1);
  });
});
