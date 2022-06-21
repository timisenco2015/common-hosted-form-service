const { MockModel, MockTransaction } = require('../../../common/dbHelper');
jest.mock('../../../../src/forms/common/models/tables/formComponentsHelpInfo', () => MockModel);
const service = require('../../../../src/forms/admin/service');

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('readFormComponentsHelpInfo', () => {
  it('returns form components help info object by id', async () => {
    let id  = '27e6dad4-b429-4a8b-b404-56726b2fc94f';
    let obj = {
      id:'27e6dad4-b429-4a8b-b404-56726b2fc94f',
      publishstatus:false,componentname:'Col-2',morehelpinfolink:'https://example.com/brake/behavior.html',
      imageurl:'https://picsum.photos/200/300',
      version:1,groupName:'',description:'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' };

    MockModel.mockResolvedValue(obj);
    const result = await service.readFormComponentsHelpInfo(id);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.where).toHaveBeenCalledWith('id', id);
    expect(result).not.toBeNull();
    expect(result).toEqual(obj);
  });

  it('returns empty object by id', async () => {
    let id  = '27e6dad4-b429-4a8b-b404-56726b2fc94f';
    MockModel.mockResolvedValue();
    const result = await service.readFormComponentsHelpInfo(id);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.where).toHaveBeenCalledWith('id', id);
    expect(result).toBeUndefined();
  });
  
});

describe('createFormComponentsHelpInfo', () => {
  const readFormComponentsHelpInfoSpy = jest.spyOn(service, 'readFormComponentsHelpInfo');

  beforeEach(() => {
    readFormComponentsHelpInfoSpy.mockReset();
  });

  it('should insert form component help info', async () => {
    const data = {
      status:false,componentName:'Col-2',moreHelpInfoLink:'https://example.com/brake/behavior.html',
      imageUrl:'https://picsum.photos/200/300',
      version:1,groupName:'layout',description:'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' };

    readFormComponentsHelpInfoSpy.mockResolvedValue(data);

    await service.createFormComponentsHelpInfo(data);
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.insert).toHaveBeenCalledTimes(1);
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    expect(readFormComponentsHelpInfoSpy).toHaveBeenCalledTimes(1);
    expect(readFormComponentsHelpInfoSpy).not.toBeUndefined();
  });

  it('should throw an error on component name is null', async () => {

    const data = {
      status:false,componentName:null,moreHelpInfoLink:'https://example.com/brake/behavior.html',
      imageUrl:'https://picsum.photos/200/300',
      version:1,groupName:'layout',description:'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' };
    
    MockModel.mockResolvedValue(undefined);
    readFormComponentsHelpInfoSpy.mockImplementation(() => { throw new Error(); });

    const fn = () => service.createFormComponentsHelpInfo(data);
    await expect(fn()).rejects.toThrow();
    expect(MockModel.query).toHaveBeenCalledTimes(1);
  });

});

describe('updateFormComponentsHelpInfo', () => {
  const param = {
    componentId:'27e6dad4-b429-4a8b-b404-56726b2fc94f',
    publishStatus: true,
    updatedBy: 'ADMIN'
  };
  const readFormComponentsHelpInfoSpy = jest.spyOn(service, 'readFormComponentsHelpInfo');
 
  beforeEach(() => {
    readFormComponentsHelpInfoSpy.mockReset();
  });

  it('should update form component help info', async () => {

    const data = {
      status:true,componentName:'Col-2',moreHelpInfoLink:'https://example.com/brake/behavior.html',
      imageUrl:'https://picsum.photos/200/300',
      version:1,groupName:'layout',description:'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' };
    
    readFormComponentsHelpInfoSpy.mockResolvedValue(data);
    
    await service.updateFormComponentsHelpInfo(param);
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(1);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledWith(param.componentId, {
      publishstatus: param.publishStatus,
      updatedBy: param.updatedBy
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    expect(readFormComponentsHelpInfoSpy).toHaveBeenCalledTimes(1);
    expect(readFormComponentsHelpInfoSpy).not.toBeUndefined();
  });
  
  it('should throw an error on componenhelpinfoid undefined', async () => {

    MockModel.mockResolvedValue(undefined);
    readFormComponentsHelpInfoSpy.mockImplementation(() => { throw new Error(); });

    const param = {
      publishStatus: true,
      updatedBy: 'ADMIN'
    };
   
    const fn = () => service.updateFormComponentsHelpInfo(param);
    await expect(fn()).rejects.toThrow();
    expect(MockModel.query).toHaveBeenCalledTimes(1);
  });
  
});
