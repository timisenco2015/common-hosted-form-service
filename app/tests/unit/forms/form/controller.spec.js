const controller = require('../../../../src/forms/form/controller');
const service = require('../../../../src/forms/form/service');

describe('listFormComponentsHelpInfo', () => {
  it('should call the service with the query params', async () => {
    service.listFormComponentsHelpInfo = jest.fn().mockReturnValue([]);
    await controller.listFormComponentsHelpInfo({}, {}, jest.fn());
    expect(service.listFormComponentsHelpInfo).toHaveBeenCalledTimes(1);
  });
});
