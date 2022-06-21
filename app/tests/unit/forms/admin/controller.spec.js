const controller = require('../../../../src/forms/admin/controller');
const service = require('../../../../src/forms/admin/service');

describe('createFormComponentsHelpInfo', () => {
  const req = {
    body: {status:false,
      componentName:'Col-2',
      moreHelpInfoLink:'https://example.com/brake/behavior.html',
      imageUrl:'https://picsum.photos/200/300',
      version:1,
      groupName:'layout',
      description:'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' },
  };
  it('should call the service with the query params', async () => {
    service.createFormComponentsHelpInfo = jest.fn().mockReturnValue({id :'27e6dad4-b429-4a8b-b404-56726b2fc94f', 
      status:false,componentName:'Col-2',
      moreHelpInfoLink:'https://example.com/brake/behavior.html',
      imageUrl:'https://picsum.photos/200/300',
      version:1,
      groupName:'layout',
      description:'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' });
    await controller.createFormComponentsHelpInfo(req, {}, jest.fn());

    expect(service.createFormComponentsHelpInfo).toHaveBeenCalledTimes(1);
    expect(service.createFormComponentsHelpInfo).toHaveBeenCalledWith(req.body);
  });
});

describe('updateFormComponentsHelpInfo', () => {
  const req = {
    params: {
      componentId:'27e6dad4-b429-4a8b-b404-56726b2fc94f',
      publishStatus: true,
      updatedBy: 'ADMIN'
    },
  };
  it('should call the service with the query params', async () => {
    service.updateFormComponentsHelpInfo = jest.fn().mockReturnValue({id :'27e6dad4-b429-4a8b-b404-56726b2fc94f', 
      status:false,
      componentName:'Col-2',
      moreHelpInfoLink:'https://example.com/brake/behavior.html',
      imageUrl:'https://picsum.photos/200/300',
      version:1,
      groupName:'layout',
      description:'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' });
    await controller.updateFormComponentsHelpInfo(req, {}, jest.fn());
    expect(service.updateFormComponentsHelpInfo).toHaveBeenCalledTimes(1);
    expect(service.updateFormComponentsHelpInfo).toHaveBeenCalledWith(req.params);
  });
});
