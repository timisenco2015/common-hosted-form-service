import { shallowMount, createLocalVue } from '@vue/test-utils';

import BasePrintButton from '@/components/base/BasePrintButton.vue';

const localVue = createLocalVue();

describe('BasePrintButton.vue', () => {
  const printSpy = jest.spyOn(window, 'print');

  beforeEach(() => {
    printSpy.mockReset();
    printSpy.mockImplementation(() => {});
  });

  afterAll(() => {
    printSpy.mockRestore();
  });

  it('calls window print function', () => {
    const wrapper = shallowMount(BasePrintButton, { localVue });
    wrapper.vm.printSubmission();

    expect(wrapper.html()).toContain('print');
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
